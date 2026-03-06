-- このスクリプトは、Supabaseの「SQL Editor」で実行してください。
-- postsテーブルに「その他のスキル」の詳細を保存するためのカラムを追加します。

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS other_skill_detail text;
