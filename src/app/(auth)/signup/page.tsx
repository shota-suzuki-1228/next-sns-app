'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    try {
      const supabase = createClient()

      // ユーザー名の重複チェック
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingProfile) {
        setError('このユーザー名は既に使用されています')
        setIsLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      // 成功の場合
      router.push('/login?message=アカウントが作成されました。ログインしてください。')
    } catch (err) {
      setError('予期しないエラーが発生しました')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            新規登録
          </h2>
        </div>
        
        {(error || searchParams.get('error')) && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error || searchParams.get('error')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              placeholder="your_username"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              minLength={6}
              disabled={isLoading}
            />
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登録中...' : '新規登録'}
            </Button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}