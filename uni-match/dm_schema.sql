-- ============================================================
-- DM（ダイレクトメッセージ）スキーマ
-- Supabase SQLエディタで実行してください
-- ============================================================

-- ============================================================
-- dm_conversations — 会話スレッド管理
-- ============================================================
create table if not exists public.dm_conversations (
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- user1_id < user2_id で重複を防ぐ
  constraint dm_conversations_unique unique (user1_id, user2_id),
  constraint dm_conversations_order check (user1_id < user2_id)
);

alter table public.dm_conversations enable row level security;

-- 参加者のみ閲覧可
create policy "Conversation participants can view"
  on public.dm_conversations for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- 認証済みユーザーが作成可
create policy "Authenticated users can create conversations"
  on public.dm_conversations for insert
  with check (
    auth.uid() = user1_id or auth.uid() = user2_id
  );

-- ============================================================
-- direct_messages — DMメッセージ
-- ============================================================
create table if not exists public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.dm_conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

-- 会話参加者のみ閲覧可
create policy "Conversation participants can view messages"
  on public.direct_messages for select
  using (
    exists (
      select 1 from public.dm_conversations
      where id = conversation_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- 会話参加者のみ送信可
create policy "Conversation participants can send messages"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.dm_conversations
      where id = conversation_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- 会話参加者が既読更新可
create policy "Conversation participants can mark read"
  on public.direct_messages for update
  using (
    exists (
      select 1 from public.dm_conversations
      where id = conversation_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- Realtimeを有効化（Supabase Dashboard > Database > Replication でも設定可）
-- alter publication supabase_realtime add table public.direct_messages;
