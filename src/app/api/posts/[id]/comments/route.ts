import { createClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, response } = createClient(request)

  try {
    // 投稿が存在するかチェック
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', id)
      .eq('published', true)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // コメントを取得（返信も含む）
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // コメントを階層構造に変換
    const rootComments = comments.filter(comment => !comment.parent_id)
    const commentReplies = comments.filter(comment => comment.parent_id)

    const commentsWithReplies = rootComments.map(comment => ({
      ...comment,
      replies: commentReplies.filter(reply => reply.parent_id === comment.id)
    }))

    return NextResponse.json(commentsWithReplies)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}