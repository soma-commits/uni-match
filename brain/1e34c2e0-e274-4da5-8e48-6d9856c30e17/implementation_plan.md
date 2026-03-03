# スレッド形式コメント機能（Reddit/Discord風）

掲示板の各投稿に対して、ユーザー同士がネスト可能なスレッド形式で会話できる機能を実装します。

## Proposed Changes

### バックエンド（DB Schema & Queries）

#### [MODIFY] [supabase_schema.sql](file:///c:/Users/sohor/.gemini/antigravity/uni-match/supabase_schema.sql)
自己参照（parent_id）を持つ `post_comments` テーブルを新規追加し、RLSポリシーを設定します。
- `id`: UUID (Primary Key)
- `post_id`: UUID (REFERENCES posts ON DELETE CASCADE)
- `author_id`: UUID (REFERENCES profiles ON DELETE CASCADE)
- `parent_id`: UUID (REFERENCES post_comments ON DELETE CASCADE) - **NULL可。返信先を指す。**
- `content`: TEXT
- `created_at` / `updated_at`: TIMESTAMPTZ

#### [MODIFY] [queries.ts](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/lib/supabase/queries.ts)
以下の関数を追加・修正します：
- `getPostComments(postId)`: 投稿に紐づく全てのコメントを取得（ネスト解決用）
- `addPostComment(postId, content, parentId?)`: 新規コメントまたは返信を追加
- `deletePostComment(commentId)`: コメントとその子コメント（CASCADE設定により自動）を削除

---

### フロントエンド（UI Components）

#### [NEW] [ThreadedComments.tsx](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/components/ThreadedComments.tsx) & [ThreadedComments.module.css](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/components/ThreadedComments.module.css)
- 再帰的（Recursive）なコンポーネントにより、Redditのようなインデント付きのツリー構造UIを描画します。
- コメントに対する「返信する」ボタン。
- コメント削除機能（作成者本人のみ）。

#### [MODIFY] [page.tsx (Post Detail)](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/app/board/[id]/page.tsx)
- ページ下部に `<ThreadedComments postId={post.id} />` コンポーネントをマウントします。

#### 通知システム連携
- 新規コメントが追加された際、**投稿の作成者** または **返信先のコメント作成者** に対して通知 (`createNotification`) を送信するようにします。

## Verification Plan

### ビルド確認
```ba