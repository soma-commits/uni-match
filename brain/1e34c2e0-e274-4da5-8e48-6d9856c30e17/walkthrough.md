# 投稿編集・削除 + 応募メッセージ + 通知システム — 実装完了

## 変更内容

| ファイル | 操作 | 内容 |
|---------|------|------|
| [queries.ts](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/lib/supabase/queries.ts) | 修正 | `updatePost`, `deletePost`, `getNotifications`, `createNotification`, `markNotificationsRead` 追加 |
| [board/[id]/edit/page.tsx](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/app/board/[id]/edit/page.tsx) | 新規 | 投稿編集ページ（既存データを初期値にフォーム表示） |
| [board/[id]/page.tsx](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/app/board/[id]/page.tsx) | 修正 | 編集/削除ボタン、応募メッセージ入力、新規申請時の通知生成 |
| [applications/page.tsx](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/app/board/[id]/applications/page.tsx) | 修正 | 承認/拒否時に申請者への通知生成 |
| [NotificationBell.tsx](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/components/NotificationBell.tsx) | 新規 | 通知ベルコンポーネント（ドロップダウン・未読バッジ・ポーリング更新） |
| [NotificationBell.module.css](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/components/NotificationBell.module.css) | 新規 | 通知ベルCSS |
| [Header.tsx](file:///c:/Users/sohor/.gemini/antigravity/uni-match/src/components/Header.tsx) | 修正 | NotificationBellをヘッダーに統合 |

## 検証結果

````carousel
![ヘッダーの通知ベル 🔔 と投稿編集/削除ボタン・応募メッセージ入力](C:/Users/sohor/.gemini/antigravity/brain/1e34c2e0-e274-4da5-8e48-6d9856c30e17/post_detail_bottom_sections_1772537827169.png)
<!-- slide -->
![投稿編集ページ — 既存データがフォームにプリロード](C:/Users/sohor/.gemini/antigravity/brain/1e34c2e0-e274-4da5-8e48-6d9856c30e17/edit_post_page_1772537847848.png)
<!-- slide -->
![掲示板ヘッダーの通知ベルアイコン](C:/Users/sohor/.gemini/antigravity/brain/1e34c2e0-e274-4da5-8e48-6d9856c30e17/board_page_with_bell_1772537798489.png)
````

![ブラウザ操作録画](C:/Users/sohor/.gemini/antigravity/brain/1e34c2e0-e274-4da5-8e48-6d9856c30e17/features_full_verify_1772537762687.webp)

> [!IMPORTANT]
> 通知システムを動作させるには、Supabaseに `notifications` テーブルを作成する必要があります。テーブルが存在しない場合、通知はコンソールにエラーログが出ますがアプリはクラッシュしません。
>
> ```sql
> CREATE TABLE notifications (
>   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
>   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
>   type TEXT NOT NULL,
>   title TEXT NOT NULL,
>   message TEXT NOT NULL,
>   link TEXT NOT NULL,
>   is_read BOOLEAN DEFAULT FALSE,
>   created_at TIMESTAMPTZ DEFAULT NOW()
> );
>
> ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
> CREATE POLICY "Authenticated users can create notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
> CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
> ```
