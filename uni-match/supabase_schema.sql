-- ============================================================
-- UniMatch Database Schema for Supabase
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. profiles — ユーザープロフィール
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  university text not null default '',
  faculty text not null default '',
  year integer not null default 1,
  bio text not null default '',
  avatar text not null default '🧑‍💻',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 全員が読める
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 本人のみ更新可
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 本人のみ挿入可
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- 2. skills — スキルマスタ
-- ============================================================
create table public.skills (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null check (category in ('engineering', 'design', 'business', 'marketing', 'data', 'other'))
);

alter table public.skills enable row level security;

create policy "Skills are viewable by everyone"
  on public.skills for select
  using (true);

-- ============================================================
-- 3. user_skills — ユーザーのスキル（多対多）
-- ============================================================
create table public.user_skills (
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  primary key (user_id, skill_id)
);

alter table public.user_skills enable row level security;

create policy "User skills are viewable by everyone"
  on public.user_skills for select
  using (true);

create policy "Users can manage own skills"
  on public.user_skills for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own skills"
  on public.user_skills for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 4. posts — 募集投稿
-- ============================================================
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  max_members integer not null default 4,
  current_members integer not null default 1,
  status text not null default 'recruiting' check (status in ('recruiting', 'closed')),
  author_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- 全員が読める
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

-- 認証済みユーザーのみ投稿可
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

-- 投稿者のみ更新可
create policy "Authors can update own posts"
  on public.posts for update
  using (auth.uid() = author_id);

-- 投稿者のみ削除可
create policy "Authors can delete own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- ============================================================
-- 5. post_required_skills — 投稿の求めるスキル（多対多）
-- ============================================================
create table public.post_required_skills (
  post_id uuid references public.posts(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  primary key (post_id, skill_id)
);

alter table public.post_required_skills enable row level security;

create policy "Post skills are viewable by everyone"
  on public.post_required_skills for select
  using (true);

create policy "Post authors can manage post skills"
  on public.post_required_skills for insert
  with check (
    exists (
      select 1 from public.posts
      where id = post_id and author_id = auth.uid()
    )
  );

-- ============================================================
-- 6. post_tags — 投稿タグ
-- ============================================================
create table public.post_tags (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  tag text not null
);

alter table public.post_tags enable row level security;

create policy "Post tags are viewable by everyone"
  on public.post_tags for select
  using (true);

create policy "Post authors can manage tags"
  on public.post_tags for insert
  with check (
    exists (
      select 1 from public.posts
      where id = post_id and author_id = auth.uid()
    )
  );

-- ============================================================
-- 7. applications — チーム参加申請
-- ============================================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (post_id, applicant_id)
);

alter table public.applications enable row level security;

-- 投稿者と申請者が読める
create policy "Applications viewable by post author and applicant"
  on public.applications for select
  using (
    auth.uid() = applicant_id or
    exists (
      select 1 from public.posts
      where id = post_id and author_id = auth.uid()
    )
  );

-- 認証済みユーザーが申請可
create policy "Authenticated users can apply"
  on public.applications for insert
  with check (auth.uid() = applicant_id);

-- 投稿者が申請ステータスを更新可
create policy "Post authors can update application status"
  on public.applications for update
  using (
    exists (
      select 1 from public.posts
      where id = post_id and author_id = auth.uid()
    )
  );

-- ============================================================
-- 8. messages — チーム内メッセージ（リアルタイム）
-- ============================================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- 投稿関係者（投稿者 or accepted申請者）のみ閲覧可
create policy "Messages viewable by team members"
  on public.messages for select
  using (
    exists (
      select 1 from public.posts where id = post_id and author_id = auth.uid()
    ) or
    exists (
      select 1 from public.applications
      where post_id = messages.post_id and applicant_id = auth.uid() and status = 'accepted'
    )
  );

-- チームメンバーのみ送信可
create policy "Team members can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and (
      exists (
        select 1 from public.posts where id = post_id and author_id = auth.uid()
      ) or
      exists (
        select 1 from public.applications
        where post_id = messages.post_id and applicant_id = auth.uid() and status = 'accepted'
      )
    )
  );

-- Realtimeを有効化
-- alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 9. トリガー: 新規ユーザー作成時にプロフィール自動作成
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '🧑‍💻'
  );
  return new;
end;
$$ language plpgsql security definer;

-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- ============================================================
-- 10. 初期スキルデータ
-- ============================================================
insert into public.skills (name, category) values
  ('React', 'engineering'),
  ('Next.js', 'engineering'),
  ('TypeScript', 'engineering'),
  ('Python', 'engineering'),
  ('Node.js', 'engineering'),
  ('Flutter', 'engineering'),
  ('AWS', 'engineering'),
  ('UI/UXデザイン', 'design'),
  ('Figma', 'design'),
  ('グラフィックデザイン', 'design'),
  ('事業計画', 'business'),
  ('財務・会計', 'business'),
  ('法務', 'business'),
  ('営業', 'business'),
  ('SNSマーケティング', 'marketing'),
  ('コンテンツ制作', 'marketing'),
  ('SEO', 'marketing'),
  ('広告運用', 'marketing'),
  ('機械学習', 'data'),
  ('データ分析', 'data'),
  ('プロジェクト管理', 'other'),
  ('プレゼン', 'other')
on conflict (name) do nothing;

-- ============================================================
-- 11. notifications — 通知
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  link text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- 本人のみ閲覧・更新可
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own notifications') then
    create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own notifications') then
    create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated users can insert notifications') then
    create policy "Authenticated users can insert notifications" on public.notifications for insert with check (auth.role() = 'authenticated');
  end if;
end
$$;

-- ============================================================
-- 12. post_comments — 掲示板のコメント（ツリー形式）
-- ============================================================
create table if not exists public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.post_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

-- 全員が読める/投稿可/削除可
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Post comments are viewable by everyone') then
    create policy "Post comments are viewable by everyone" on public.post_comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated users can post comments') then
    create policy "Authenticated users can post comments" on public.post_comments for insert with check (auth.uid() = author_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authors or post owners can delete comments') then
    create policy "Authors or post owners can delete comments" on public.post_comments for delete using (
      auth.uid() = author_id or
      exists (select 1 from public.posts where id = post_id and author_id = auth.uid())
    );
  end if;
end
$$;
