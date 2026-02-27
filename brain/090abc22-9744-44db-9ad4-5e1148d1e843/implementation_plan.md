# Phase 2: Supabase統合 — 実装計画

## 概要
現在LocalStorage + モックデータで動作しているUniMatchアプリを、Supabaseバックエンドに接続し、**データ永続化・認証・リアルタイム機能**を実現する。

## User Review Required

> [!IMPORTANT]
> **Supabaseプロジェクト**: 実装を進めるには、[Supabase](https://supabase.com)でプロジェクトを作成し、`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を取得する必要があります。

> [!WARNING]
> **認証の段階的実装**: 初期段階ではSupabase Authのマジックリンク（メール認証）を使用します。`.ac.jp`ドメイン制限はサーバー側のRLSポリシーで強制します。

---

## Proposed Changes

### 1. 依存関係追加
#### [MODIFY] [package.json](file:///C:/Users/sohor/.gemini/antigravity/uni-match/package.json)
- `@supabase/supabase-js` — Supabase SDK
- `@supabase/ssr` — Next.js SSR向けクライアント

---

### 2. DBスキーマ（SQL）
#### [NEW] [supabase_schema.sql](file:///C:/Users/sohor/.gemini/antigravity/uni-match/supabase_schema.sql)

```sql
-- users: Supabase Authと連携したプロフィール
-- posts: 募集投稿
-- post_skills: 投稿に紐づく求めるスキル
-- user_skills: ユーザーのスキル
-- applications: チーム参加申請
-- messages: チーム内チャット
```

| テーブル | 説明 |
|---|---|
| `profiles` | ユーザープロフィール（auth.usersに紐づく） |
| `skills` | スキルマスタ |
| `user_skills` | ユーザーとスキルの多対多 |
| `posts` | 募集投稿 |
| `post_required_skills` | 投稿と求めるスキルの多対多 |
| `post_tags` | 投稿タグ |
| `applications` | チーム参加申請 |
| `messages` | チーム内メッセージ（リアルタイム） |

---

### 3. Supabaseクライアント設定
#### [NEW] [lib/supabase/client.ts](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/lib/supabase/client.ts)
- ブラウザ用Supabaseクライアント

#### [NEW] [lib/supabase/server.ts](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/lib/supabase/server.ts)
- サーバーサイド用Supabaseクライアント

#### [NEW] [lib/supabase/middleware.ts](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/lib/supabase/middleware.ts)
- セッション管理ミドルウェア

#### [NEW] [middleware.ts](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/middleware.ts)
- 認証状態チェック（保護ルート: `/board/new`, `/mypage`）

---

### 4. 認証フロー改修
#### [MODIFY] [login/page.tsx](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/app/login/page.tsx)
- Supabase Auth マジックリンク送信
- `.ac.jp` ドメインバリデーション
- 初回ログイン時のプロフィール作成画面への誘導

#### [NEW] [auth/callback/route.ts](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/app/auth/callback/route.ts)
- マジックリンクのコールバック処理

---

### 5. データアクセス層
#### [NEW] [lib/supabase/queries.ts](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/lib/supabase/queries.ts)
- `getPosts()` — 投稿一覧取得（フィルタ・ソート）
- `getPostById()` — 投稿詳細取得
- `createPost()` — 投稿作成
- `getProfile()` — プロフィール取得
- `updateProfile()` — プロフィール更新
- `applyToPost()` — チーム参加申請
- `getMyApplications()` — 自分の応募一覧

---

### 6. 各ページの改修
#### [MODIFY] board/page.tsx
- `getStoredPosts()` → `getPosts()` に置換

#### [MODIFY] board/new/page.tsx
- `addPost()` → `createPost()` に置換

#### [MODIFY] board/[id]/page.tsx
- `getStoredPosts().find()` → `getPostById()` に置換
- 参加申請を `applyToPost()` で永続化

#### [MODIFY] profile/[id]/page.tsx
- `MOCK_USERS.find()` → `getProfile()` に置換

#### [MODIFY] mypage/page.tsx
- `getCurrentUser()` → Supabase Authセッションに置換

#### [MODIFY] Header.tsx
- セッションベースのユーザー表示

---

### 7. リアルタイムチャット
#### [NEW] [app/board/[id]/chat/page.tsx](file:///C:/Users/sohor/.gemini/antigravity/uni-match/src/app/board/[id]/chat/page.tsx)
- Supabase Realtimeを使った投稿別チャットルーム
- メッセージの送受信

---

## Verification Plan

### Automated Tests
```bash
npm run build
```

### Browser Verification
- ログインフロー（マジックリンク送信→コールバック→リダイレクト）
- 投稿のCRUD操作がDBに永続化されること
- ページリロード後もデータが保持されること
- 認証ガード（未ログイン時のリダイレクト）
- リアルタイムチャットの動作確認
