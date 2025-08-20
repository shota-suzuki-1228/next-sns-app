# チケット #02: Supabase設定・データベース構築

## 概要
Supabaseプロジェクト作成、データベース設計・構築、Row Level Security（RLS）設定を行う。

## TODO
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定（.env.local）
- [ ] データベーステーブル作成（SQL実行）
- [ ] Row Level Security（RLS）ポリシー設定
- [ ] ストレージバケット作成（画像アップロード用）
- [ ] TypeScript型定義ファイル生成
- [ ] Supabaseクライアント設定ファイル作成
- [ ] データベース接続テスト

## データベース設計

### テーブル作成SQL

#### 1. profiles テーブル
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. categories テーブル
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. posts テーブル
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES categories(id),
  image_url TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. tags テーブル
```sql
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. post_tags テーブル（多対多関係）
```sql
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

#### 6. likes テーブル
```sql
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

#### 7. reposts テーブル
```sql
CREATE TABLE reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

#### 8. comments テーブル
```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. follows テーブル
```sql
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
```

### Row Level Security (RLS) ポリシー

#### profiles テーブル
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールは全員が閲覧可能
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 本人のみ更新可能
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 本人のみ挿入可能
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### posts テーブル
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 公開記事は全員が閲覧可能
CREATE POLICY "Published posts are viewable by everyone" ON posts
  FOR SELECT USING (published = true);

-- 本人のみ投稿作成可能
CREATE POLICY "Users can create own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 本人のみ更新可能
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 本人のみ削除可能
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

#### likes テーブル
```sql
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- いいねは全員が閲覧可能
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

-- 認証済みユーザーのみいいね操作可能
CREATE POLICY "Users can manage own likes" ON likes
  FOR ALL USING (auth.uid() = user_id);
```

#### comments テーブル
```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- コメントは全員が閲覧可能
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- 認証済みユーザーのみコメント作成可能
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 本人のみ更新・削除可能
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
```

### ストレージ設定

#### 画像用バケット作成
```sql
-- 画像用バケット
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- ストレージポリシー
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = owner);
```

### サンプルデータ挿入

#### カテゴリのサンプルデータ
```sql
INSERT INTO categories (name, description, color) VALUES 
  ('技術', 'プログラミングや開発に関する記事', '#3B82F6'),
  ('日記', '日常の出来事や思考', '#10B981'),
  ('レビュー', '商品やサービスのレビュー', '#F59E0B'),
  ('その他', 'その他の雑記', '#8B5CF6');
```

#### タグのサンプルデータ
```sql
INSERT INTO tags (name) VALUES 
  ('Next.js'), ('React'), ('TypeScript'), ('Supabase'), 
  ('Web開発'), ('フロントエンド'), ('バックエンド'), ('UI/UX'),
  ('JavaScript'), ('CSS'), ('Node.js'), ('PostgreSQL');
```

### Supabaseクライアント設定

#### lib/supabase/types.ts
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 他のテーブルも同様に定義...
    }
  }
}
```

## 完了条件
- [ ] Supabaseプロジェクトが作成されている
- [ ] 全てのテーブルが作成されている
- [ ] RLSポリシーが適切に設定されている
- [ ] ストレージバケットが作成されている
- [ ] サンプルデータが挿入されている
- [ ] 環境変数が設定されている
- [ ] TypeScript型定義が生成されている
- [ ] データベース接続テストが成功する

## 関連チケット
- 前: #01 プロジェクト初期化・基盤構築
- 次: #03 認証システム実装
- 依存: #01の完了が必要

## 注意事項
- RLSポリシーは慎重に設定し、セキュリティホールがないか確認
- 本番環境用の環境変数は別途設定が必要
- データベースマイグレーション用のSQLスクリプトも保存しておく

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
Supabase管理画面でのSQL実行とCLIツールの両方を使用可能。
型定義は`supabase gen types typescript --project-id <project-id> --schema public`で生成。