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

    const { post_id } = await request.json()

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
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

    // 既にリポストしているかチェック
    const { data: existingRepost } = await supabase
      .from('reposts')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .single()

    if (existingRepost) {
      return NextResponse.json(
        { error: 'Already reposted' },
        { status: 409 }
      )
    }

    // リポストを作成
    const { data: repost, error } = await supabase
      .from('reposts')
      .insert({
        post_id,
        user_id: user.id
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
      console.error('Error creating repost:', error)
      return NextResponse.json(
        { error: 'Failed to create repost' },
        { status: 500 }
      )
    }

    return NextResponse.json(repost, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, response } = createClient(request)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { post_id } = await request.json()

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      )
    }

    // リポストを削除（作成者のみ）
    const { error } = await supabase
      .from('reposts')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting repost:', error)
      return NextResponse.json(
        { error: 'Failed to delete repost' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Repost deleted successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}