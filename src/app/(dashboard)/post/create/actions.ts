'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()

  // ユーザー認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login?error=ログインが必要です')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const isDraft = formData.get('draft') === 'true'

  // プロフィールの存在確認・作成
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code === 'PGRST116') {
    // プロフィールが存在しない場合は作成
    const { error: insertProfileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        email: user.email || null,
        display_name: user.user_metadata?.display_name || null,
      })

    if (insertProfileError) {
      console.error('Profile creation error:', insertProfileError)
      redirect('/post/create?error=プロフィールの作成に失敗しました')
    }
  }

  // excerptの生成（最初の200文字、改行やMarkdown記法を削除）
  const excerpt = content
    .replace(/[#*`\[\]]/g, '') // Markdown記法を削除
    .replace(/\n+/g, ' ') // 改行をスペースに変換
    .trim()
    .substring(0, 200)

  // 投稿の作成
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      content,
      author_id: user.id,
      published: !isDraft,
      excerpt: excerpt || null
    })
    .select()
    .single()

  if (error) {
    console.error('Post creation error:', error)
    redirect('/post/create?error=投稿の作成に失敗しました')
  }

  if (isDraft) {
    redirect('/?message=下書きを保存しました')
  } else {
    redirect(`/post/${data.id}`)
  }
}

export async function saveDraft(formData: FormData) {
  formData.set('draft', 'true')
  return createPost(formData)
}