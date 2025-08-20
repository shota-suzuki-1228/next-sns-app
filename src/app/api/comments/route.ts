import { createClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { supabase, response } = createClient(request)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { post_id, content, parent_id } = await request.json()

    if (!post_id || !content) {
      return NextResponse.json(
        { error: 'post_id and content are required' },
        { status: 400 }
      )
    }

    // 投稿が存在するかチェック
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', post_id)
      .eq('published', true)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // コメントを作成
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id,
        user_id: user.id,
        content,
        parent_id: parent_id || null
      })
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}