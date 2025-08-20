'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      redirect('/login?error=メールアドレスとパスワードを入力してください')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Login error:', error)
      redirect('/login?error=' + encodeURIComponent(error.message))
    }

    redirect('/')
  } catch (error) {
    console.error('Login action error:', error)
    redirect('/login?error=予期しないエラーが発生しました')
  }
}

export async function logout() {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      redirect('/login?error=ログアウトに失敗しました')
    }

    redirect('/login')
  } catch (error) {
    console.error('Logout action error:', error)
    redirect('/login?error=予期しないエラーが発生しました')
  }
}