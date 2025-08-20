# チケット #03: 認証システム実装

## 概要
Supabase認証を使用したNext.js App Routerでの認証システムを実装。Server Actions、Middleware、RLSとの統合を行う。

## TODO
- [ ] Supabaseクライアント設定（Server/Client/Route Handler用）
- [ ] Middleware実装（トークンリフレッシュ）
- [ ] 認証Context Provider実装
- [ ] ログイン・サインアップページ作成
- [ ] Server Actions実装（login/signup/logout）
- [ ] 認証ガード（保護ページ）実装
- [ ] プロフィール自動作成トリガー設定
- [ ] 認証状態に応じたナビゲーション実装
- [ ] エラーハンドリング実装

## 詳細実装

### 1. Supabaseクライアント設定

#### lib/supabase/server.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
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

#### lib/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### lib/supabase/route-handler.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
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

### 2. Middleware実装

#### middleware.ts
```typescript
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
  const { data: { user } } = await supabase.auth.getUser()

  // 保護されたルートへのアクセス制御
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if ((request.nextUrl.pathname === '/login' || 
       request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3. 認証Context Provider

#### components/auth/auth-provider.tsx
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(profile)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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

### 4. 認証関連のServer Actions

#### app/(auth)/actions.ts
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
})

const SignupSchema = LoginSchema.extend({
  username: z.string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(20, 'ユーザー名は20文字以下で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます'),
  displayName: z.string().min(1, '表示名を入力してください'),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedData = LoginSchema.parse(rawData)

  const { error } = await supabase.auth.signInWithPassword(validatedData)

  if (error) {
    console.error('Login error:', error)
    redirect('/login?error=invalid_credentials')
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
    displayName: formData.get('displayName') as string,
  }

  const validatedData = SignupSchema.parse(rawData)

  // ユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
  })

  if (authError) {
    console.error('Signup error:', authError)
    redirect('/signup?error=signup_failed')
  }

  // プロフィール作成
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        username: validatedData.username,
        display_name: validatedData.displayName,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // ユーザーは作成されているので、プロフィール作成のリトライが必要
    }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### 5. ログイン・サインアップページ

#### app/(auth)/login/page.tsx
```typescript
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">ログイン</h2>
          <p className="mt-2 text-muted-foreground">
            アカウントにログインしてください
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {searchParams.error === 'invalid_credentials' 
              ? 'メールアドレスまたはパスワードが正しくありません'
              : 'エラーが発生しました'
            }
          </div>
        )}

        <form className="space-y-4">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
            />
          </div>
          
          <div>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="パスワード"
            />
          </div>

          <Button formAction={login} className="w-full">
            ログイン
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は{' '}
            <Link href="/signup" className="text-primary hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### app/(auth)/signup/page.tsx
```typescript
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">新規登録</h2>
          <p className="mt-2 text-muted-foreground">
            新しいアカウントを作成してください
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            エラーが発生しました
          </div>
        )}

        <form className="space-y-4">
          <div>
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              placeholder="username"
            />
          </div>

          <div>
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="山田太郎"
            />
          </div>

          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
            />
          </div>
          
          <div>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="パスワード（6文字以上）"
            />
          </div>

          <Button formAction={signup} className="w-full">
            新規登録
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 6. 認証ガード実装

#### lib/auth-guard.ts
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  return user
}

export async function redirectIfAuthenticated() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }
}
```

## 完了条件
- [ ] 認証システムが正常に動作する
- [ ] ログイン・ログアウトが正常に行える
- [ ] 新規登録時にプロフィールが自動作成される
- [ ] Middlewareによる保護ページアクセス制御が機能する
- [ ] 認証状態がリアルタイムで同期される
- [ ] エラーハンドリングが適切に行われる
- [ ] TypeScriptエラーがない

## 関連チケット
- 前: #02 Supabase設定・データベース構築
- 次: #04 基本UIコンポーネント・レイアウト実装
- 依存: #02の完了が必要

## 注意事項
- 必ず`getUser()`を使用し、`getSession()`は使用しない
- キャッシュを適切に無効化する
- プロフィール作成エラー時のリトライ機能を考慮

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
認証システムはセキュリティの要。RLSとの連携も重要。