-- reposts テーブル作成（リツイート機能）
CREATE TABLE IF NOT EXISTS public.reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT, -- 引用リポスト時のコメント（オプション）
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- RLS有効化
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- reposts RLSポリシー
DROP POLICY IF EXISTS "Reposts are viewable by everyone" ON public.reposts;
DROP POLICY IF EXISTS "Users can manage own reposts" ON public.reposts;

CREATE POLICY "Reposts are viewable by everyone" ON public.reposts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reposts" ON public.reposts
  FOR ALL USING (auth.uid() = user_id);

-- インデックス追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON public.reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON public.reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_created_at ON public.reposts(created_at DESC);