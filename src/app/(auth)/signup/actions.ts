'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    if (!email || !password || !username) {
      redirect('/signup?error=すべてのフィールドを入力してください')
    }

    // ユーザー名の重複チェック
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingProfile) {
      redirect('/signup?error=このユーザー名は既に使用されています')
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        }
      }
    })

    if (error) {
      console.error('Signup error:', error)
      redirect('/signup?error=' + encodeURIComponent(error.message))
    }

    // Supabase Authの確認メールが有効な場合のみプロフィールは後で作成される
    // 確認メール送信の場合は即座にプロフィールは作成しない
    
    redirect('/login?message=確認メールを送信しました。メールをご確認ください。')
  } catch (error) {
    console.error('Signup action error:', error)
    redirect('/signup?error=予期しないエラーが発生しました')
  }
}