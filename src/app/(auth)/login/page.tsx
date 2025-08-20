'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
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

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      // 成功の場合
      router.push('/')
      router.refresh()
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
            ログイン
          </h2>
        </div>
        
        {(error || searchParams.get('error')) && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error || searchParams.get('error')}
          </div>
        )}
        
        {searchParams.get('message') && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
            {searchParams.get('message')}
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
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}