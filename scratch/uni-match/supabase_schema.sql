-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Universities Table
create table public.universities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text not null unique, -- e.g., 'stanford.edu'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table (Public Profile)
-- Note: This is linked to auth.users via a trigger (to be implemented) or manual insert
create type user_status as enum ('pending', 'verified', 'rejected');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, -- Managed by Supabase Auth, but good to have a copy or reference
  full_name text,
  university_id uuid references public.universities(id),
  status user_status default 'pending',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table (Extended details)
create table public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  major text,
  bio text,
  skills jsonb default '[]'::jsonb,
  resume_url text,
  embedding vector(1536), -- For Gemini/OpenAI embeddings
  is_verified boolean default false -- For ID verification
);

-- Boards Table
create table public.boards (
  id uuid primary key default uuid_generate_v4(),
  university_id uuid references public.universities(id) not null,
  author_id uuid references public.users(id) not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events Table
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  university_id uuid references public.universities(id) not null,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  is_paid boolean default false,
  price integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.users(id) not null,
  receiver_id uuid references public.users(id) not null,
  content text not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false
);

-- RLS Policies
alter table public.universities enable row level security;
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;

-- University: readable by everyone, only admin can insert (assumed admin role or direct DB access for now)
create policy "Universities are viewable by everyone" on public.universities for select using (true);

-- Users: viewable by authenticated users from the SAME university? Or maybe just recommendations?
-- For now, let's allow authenticated users to view other users (for matching context)
create policy "Users are viewable by authenticated users" on public.users for select using (auth.role() = 'authenticated');
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

-- Boards: viewable only by users of the same university
create policy "Boards viewable by same university members" on public.boards
  for select using (
    auth.role() = 'authenticated' and 
    university_id = (select university_id from public.users where id = auth.uid())
  );

create policy "Users can create posts in their university board" on public.boards
  for insert with check (
    auth.role() = 'authenticated' and
    university_id = (select university_id from public.users where id = auth.uid())
  );

-- Messages: only sender and receiver can view
create policy "Users can view their own messages" on public.messages
  for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
  );

