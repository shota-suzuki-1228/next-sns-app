-- follows テーブルを削除して再作成（外部キー制約を正しく設定）

-- 既存のfollowsテーブルを削除
DROP TABLE IF EXISTS public.follows CASCADE;

-- followsテーブルを再作成（正しい外部キー制約付き）
CREATE TABLE public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(follower_id, followed_id)
);

-- RLSを有効化
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを設定
CREATE POLICY "Users can view all follows" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can create follows for themselves" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- インデックスを作成
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_followed_id ON public.follows(followed_id);
CREATE INDEX idx_follows_created_at ON public.follows(created_at);

-- 制約を追加（自分自身をフォローできないようにする）
ALTER TABLE public.follows ADD CONSTRAINT no_self_follow CHECK (follower_id != followed_id);