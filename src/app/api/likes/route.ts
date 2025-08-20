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

    // 既にいいねしているかチェック
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 409 }
      )
    }

    // いいねを作成
    const { data: like, error } = await supabase
      .from('likes')
      .insert({
        post_id,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating like:', error)
      return NextResponse.json(
        { error: 'Failed to create like' },
        { status: 500 }
      )
    }

    // いいね数を取得
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id)

    return NextResponse.json({
      like,
      count: count || 0,
      liked: true
    })
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

    // いいねを削除
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting like:', error)
      return NextResponse.json(
        { error: 'Failed to delete like' },
        { status: 500 }
      )
    }

    // いいね数を取得
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id)

    return NextResponse.json({
      count: count || 0,
      liked: false
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}