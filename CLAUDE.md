# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ソーシャルブログプラットフォーム開発ガイド

## プロジェクト概要
Next.js 15とClaude Codeを用いた簡易的なソーシャルブログツールの作成。企業向けポートフォリオとして提出予定。
X（Twitter）ライクなデザインでありながら独自性を持たせた、Markdownベースのブログプラットフォーム。

## 開発コマンド

- `npm run dev` - 開発サーバー起動（Turbopack使用、http://localhost:3000）
- `npm run build` - プロダクション用ビルド
- `npm start` - プロダクションサーバー起動
- `npm run lint` - ESLintコード品質チェック

## 技術構成

### フロントエンド
- **Next.js 15** (App Router) - React フレームワーク
- **React 19.1.0** - UIライブラリ（TypeScript）
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネントライブラリ
- **React Hook Form** - フォーム管理
- **Zod** - バリデーションライブラリ
- **react-markdown** - Markdownレンダリング
- **remark-gfm** - GitHub Flavored Markdown対応

### バックエンド・データベース
- **Supabase** - BaaS（Backend as a Service）
  - Authentication - ユーザー認証システム
  - Database - PostgreSQLデータベース
  - Storage - 画像アップロード用ストレージ
  - Real-time subscriptions - リアルタイム更新

### デプロイ
- **Vercel** - ホスティングプラットフォーム

## 機能要件

### ユーザー認証機能
- **ログイン済みユーザー**：記事投稿、記事閲覧、プロフィール変更、いいね・リツイート、コメント投稿
- **未ログインユーザー**：記事閲覧のみ可能

### 記事機能
- **投稿形式**：Markdown対応
- **画像アップロード**：Supabase Storage使用
- **検索機能**：全文検索対応
- **カテゴリ・タグ機能**：記事の分類と検索性向上

### ソーシャル機能
- **いいね機能**：投稿への評価
- **リツイート機能**：投稿の共有
- **コメント機能**：投稿への返信
- **フォロー機能**：ユーザー間のつながり
- **プロフィール表示**：プロフィール画像、ユーザー情報

## プロジェクト構造

```
social-blog-platform/
├── app/
│   ├── (auth)/                    # 認証関連ページ
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/               # メインアプリケーション
│   │   ├── profile/
│   │   ├── post/
│   │   │   ├── [id]/
│   │   │   └── create/
│   │   └── search/
│   ├── api/                       # API Routes
│   │   ├── posts/
│   │   ├── likes/
│   │   ├── comments/
│   │   └── upload/
│   ├── components/                # UIコンポーネント
│   │   ├── ui/                    # shadcn/ui基本コンポーネント
│   │   ├── auth/                  # 認証関連
│   │   ├── posts/                 # 投稿関連
│   │   ├── common/                # 共通コンポーネント
│   │   └── markdown/              # Markdown関連
│   ├── hooks/                     # カスタムフック
│   ├── lib/                       # ユーティリティ関数
│   ├── types/                     # 型定義
│   └── globals.css
├── components.json                # shadcn/ui設定
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## データベース設計

### 主要テーブル構成
- **profiles** - ユーザープロフィール情報
- **posts** - ブログ投稿データ
- **categories** - 投稿カテゴリ
- **tags** - 投稿タグ
- **post_tags** - 投稿とタグの関連付け
- **likes** - いいね機能
- **reposts** - リツイート機能
- **comments** - コメント機能
- **follows** - フォロー関係

### セキュリティ設定
- Row Level Security（RLS）を全テーブルで有効化
- 適切な認証ポリシーの実装
- 画像アップロード用ストレージバケット設定

## 開発セットアップ

### 必要な環境変数 (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### パッケージインストール
```bash
# 必要なパッケージのインストール
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @hookform/resolvers react-hook-form zod
npm install @radix-ui/react-avatar @radix-ui/react-button @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-input @radix-ui/react-label
npm install @radix-ui/react-textarea @radix-ui/react-toast @radix-ui/react-tooltip
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react react-markdown remark-gfm rehype-highlight
npm install @tailwindcss/typography

# shadcn/ui セットアップ
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea avatar dropdown-menu dialog toast
```

## 開発順序（推奨）

### ステップ1: プロジェクト基盤構築
1. Supabaseプロジェクト作成・データベース設定
2. 環境変数設定
3. 基本的なレイアウト・ルーティング構造構築
4. shadcn/ui設定とベースコンポーネント作成

### ステップ2: 認証システム実装
1. Supabase認証設定
2. `lib/supabase.ts`でSupabaseクライアント設定
3. `components/auth/AuthProvider.tsx`で認証状態管理
4. ログイン・サインアップフォーム作成

### ステップ3: 記事機能実装
1. `components/posts/PostCreate.tsx` - Markdownエディタ付き記事投稿
2. `components/posts/PostTimeline.tsx` - タイムライン表示
3. `components/posts/PostCard.tsx` - 記事カードコンポーネント
4. 記事詳細ページと編集機能

### ステップ4: ソーシャル機能実装
1. いいね機能（リアルタイム更新付き）
2. リポスト機能
3. コメント機能
4. フォロー機能

### ステップ5: 拡張機能実装
1. 検索機能（全文検索）
2. カテゴリ・タグ機能
3. 画像アップロード（Supabase Storage）
4. プロフィール編集

## 重要な実装ポイント

### Markdownエディタ
- `react-markdown`と`remark-gfm`を使用
- リアルタイムプレビュー機能
- 画像のドラッグ&ドロップ対応
- コードシンタックスハイライト（`rehype-highlight`）

### リアルタイム機能
```typescript
// リアルタイム購読の実装例
useEffect(() => {
  const channel = supabase
    .channel('posts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
      // 投稿の変更をリアルタイムで反映
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### 画像アップロード
```typescript
const uploadImage = async (file: File) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `images/${fileName}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file)

  if (error) throw error
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`
}
```

### 型安全性の確保
- `types/database.ts`でSupabaseの型定義
- Zodスキーマによるバリデーション
- TypeScript厳密モードの使用

## セキュリティとパフォーマンス

### セキュリティ対策
- Row Level Security（RLS）の適切な設定
- XSS対策（react-markdownの適切な設定）
- CSRF対策
- 入力値のサニタイゼーション

### パフォーマンス最適化
- 画像の最適化（Next.js Imageコンポーネント）
- ページネーションの実装
- リアルタイム購読の適切な管理
- バンドルサイズの最適化

## デプロイ設定

### Vercel設定
- 環境変数の設定
- ビルド設定の最適化
- ドメイン設定

### 本番環境の注意点
- Supabase RLSポリシーの検証
- 画像アップロード制限の設定
- レート制限の実装

## Next.js App Router ベストプラクティス

### プロジェクト構造のベストプラクティス

#### 推奨ディレクトリ構成
```
src/
├── app/                              # App Router（ルーティング専用）
│   ├── (auth)/                       # ルートグループ
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/                  # メインアプリケーション
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── post/
│   │       ├── [id]/
│   │       │   └── page.tsx
│   │       └── create/
│   │           └── page.tsx
│   ├── api/                          # API Routes
│   │   ├── posts/
│   │   │   └── route.ts
│   │   └── auth/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx                    # ルートレイアウト
│   ├── loading.tsx                   # ローディングUI
│   ├── error.tsx                     # エラーUI
│   ├── not-found.tsx                 # 404ページ
│   └── page.tsx                      # ホームページ
├── components/                       # 共有コンポーネント
│   ├── ui/                           # shadcn/ui基本コンポーネント
│   ├── features/                     # 機能別コンポーネント
│   │   ├── auth/
│   │   ├── posts/
│   │   └── profile/
│   └── layout/                       # レイアウトコンポーネント
├── lib/                              # ユーティリティ関数
│   ├── supabase.ts
│   ├── utils.ts
│   └── validations.ts
├── hooks/                            # カスタムフック
├── types/                            # TypeScript型定義
├── context/                          # React Context
└── constants/                        # 定数定義
```

#### 重要な構成ルール
1. **appディレクトリはルーティング専用**：ビジネスロジックや複雑なコンポーネントは`src/components`に配置
2. **深いネストを避ける**：`src/components/features/dashboard/widgets/weather/current/small/index.tsx`のような深いパスは避ける
3. **ルートグループの活用**：`(auth)`、`(dashboard)`のようにパレンティスで区切り、URLに影響しない論理的グループ化
4. **特別なファイル名を活用**：`layout.tsx`、`loading.tsx`、`error.tsx`、`not-found.tsx`など

### レンダリング戦略のベストプラクティス

#### Server Components vs Client Components
- **デフォルトはServer Components**：すべてのコンポーネントはサーバーコンポーネントとして実装
- **Client Componentsの最小化**：`"use client"`は必要最小限に留める
- **境界の明確化**：Server ComponentとClient Componentの境界を明確に定義

#### データフェッチング戦略
```typescript
// ✅ 推奨：Server Componentでのデータフェッチング
async function PostsPage() {
  const posts = await fetch('/api/posts', { cache: 'no-store' })
  return <PostList posts={posts} />
}

// ❌ 非推奨：Client ComponentでのuseEffect
function PostsPage() {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    fetch('/api/posts').then(res => setPosts(res))
  }, [])
  return <PostList posts={posts} />
}
```

#### レンダリングモードの選択
- **SSG（Static Site Generation）**：更新頻度の低いコンテンツ（About、利用規約など）
- **ISR（Incremental Static Regeneration）**：定期的に更新されるコンテンツ（ブログ記事一覧）
- **SSR（Server-Side Rendering）**：リアルタイム性が重要（ダッシュボード、タイムライン）
- **Client-Side Rendering**：高度なインタラクションが必要な部分のみ

### パフォーマンス最適化

#### ローディングとエラーハンドリング
```typescript
// app/posts/loading.tsx
export default function Loading() {
  return <PostsSkeleton />
}

// app/posts/error.tsx
'use client'
export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundary error={error} reset={reset} />
}
```

#### Suspenseの活用
```typescript
import { Suspense } from 'react'

export default function PostsPage() {
  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList />
      </Suspense>
      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsList />
      </Suspense>
    </div>
  )
}
```

### キャッシング戦略

#### Data Cache の活用
```typescript
// デフォルト：force-cache（無期限キャッシュ）
const staticData = await fetch('/api/data')

// リアルタイムデータ：no-store
const realTimeData = await fetch('/api/data', { cache: 'no-store' })

// 時間ベースキャッシュ：revalidate
const timedData = await fetch('/api/data', { next: { revalidate: 60 } })

// タグベースキャッシュ：tags
const taggedData = await fetch('/api/data', { next: { tags: ['posts'] } })
```

#### revalidateの適切な使用
```typescript
// app/posts/page.tsx
export const revalidate = 60 // 60秒ごとに再生成

// app/posts/[id]/page.tsx  
export async function generateStaticParams() {
  const posts = await fetch('/api/posts')
  return posts.map(post => ({ id: post.id }))
}
```

### Metadata の最適化

#### 動的メタデータ
```typescript
// app/posts/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await fetch(`/api/posts/${params.id}`)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    }
  }
}
```

### API Routes のベストプラクティス

#### RESTful API 設計
```typescript
// app/api/posts/route.ts
export async function GET() {
  // 投稿一覧取得
}

export async function POST() {
  // 新規投稿作成
}

// app/api/posts/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // 特定投稿取得
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // 投稿更新
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // 投稿削除
}
```

#### エラーハンドリング
```typescript
export async function GET() {
  try {
    const data = await fetchData()
    return Response.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### セキュリティベストプラクティス

#### 認証・認可の実装
```typescript
// lib/auth.ts
export async function getServerSession() {
  // サーバーサイドでのセッション取得
}

// app/api/posts/route.ts
export async function POST() {
  const session = await getServerSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 認証済みユーザーのみ投稿可能
}
```

#### 入力値検証
```typescript
import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  categoryId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const validation = PostSchema.safeParse(body)
  
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 })
  }
  
  // バリデーション済みデータで処理
}
```

### 開発効率化のベストプラクティス

#### TypeScript活用
```typescript
// types/database.ts - Supabase型定義の活用
export type Database = {
  // Supabaseから自動生成された型
}

// types/api.ts - API レスポンス型
export interface PostResponse {
  id: string
  title: string
  content: string
  author: UserProfile
  createdAt: string
}
```

#### 環境変数の管理
```typescript
// lib/config.ts
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
    env: process.env.NODE_ENV,
  }
} as const
```

### 避けるべきアンチパターン

#### ❌ 避けるべき実装
- appディレクトリ内に複雑なビジネスロジックを配置
- 不必要な`"use client"`の濫用  
- useEffect内でのデータフェッチング（Server Componentで可能な場合）
- 深いコンポーネントネスト（5階層以上）
- metadataの動的生成を怠る
- キャッシュ戦略を考慮しないデータフェッチング

#### ✅ 推奨される実装
- Server Componentでのデータフェッチング
- 適切なSuspense境界の設定
- エラーバウンダリの活用
- メタデータの最適化
- TypeScript型定義の活用
- 環境別設定の分離

## Supabase認証 ベストプラクティス

### パッケージ構成
```bash
# 必須パッケージ
npm install @supabase/supabase-js @supabase/ssr
```

### Supabaseクライアント設定

#### 1. Server Component用クライアント
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentでのset操作は無視
          }
        },
      },
    }
  )
}
```

#### 2. Client Component用クライアント  
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 3. Route Handler用クライアント
```typescript
// lib/supabase/route-handler.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}
```

### Middleware設定

#### 認証状態の自動更新
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 認証状態を更新（期限切れトークンのリフレッシュ）
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 認証実装パターン

#### 1. Server Actionを使用したログイン
```typescript
// app/login/actions.ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  redirect('/')
}
```

#### 2. ログインページコンポーネント
```typescript
// app/login/page.tsx
import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
```

#### 3. 認証ガードの実装
```typescript
// app/protected/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <p>Hello {data.user.email}</p>
}
```

### セキュリティベストプラクティス

#### ⚠️ 重要なセキュリティ注意点
```typescript
// ❌ 危険：Cookieは偽装可能
const user = await supabase.auth.getSession() // セッションのみチェック

// ✅ 安全：サーバーサイドでユーザー検証
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  redirect('/login')
}
```

#### API Routes での認証
```typescript
// app/api/protected/route.ts
import { createClient } from '@/lib/supabase/route-handler'

export async function GET(request: Request) {
  const { supabase, response } = createClient(request)
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 認証済みユーザーのみアクセス可能
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)

  return Response.json(data)
}
```

#### Row Level Security (RLS) 連携
```typescript
// Server Componentでの安全なデータフェッチング
async function fetchUserPosts() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // RLSポリシーにより、ユーザー自身のデータのみ取得
  const { data } = await supabase
    .from('posts')
    .select('*')

  return data || []
}
```

### Client-Side認証状態管理

#### React Context での認証状態管理
```typescript
// components/auth/auth-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### データフェッチング時の注意点

#### キャッシュの無効化
```typescript
// 認証済みデータは必ずキャッシュを無効化
const { data } = await supabase
  .from('posts')
  .select('*')
// Next.jsのキャッシュを無効化
export const dynamic = 'force-dynamic'
```

#### 環境変数設定
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 重要な実装ルール

#### ✅ 必ず守るべきルール
1. **常に`supabase.auth.getUser()`でユーザー検証**
2. **各ルートで新しいSupabaseクライアント作成**
3. **Middlewareでトークンリフレッシュ**
4. **Server ActionsとClient Componentsで適切なクライアント使用**
5. **認証済みデータはキャッシュ無効化**

#### ❌ 避けるべきパターン
- `getSession()`のみでの認証チェック
- Supabaseクライアントの使い回し
- 認証済みデータのキャッシュ化
- Cookie値の直接操作