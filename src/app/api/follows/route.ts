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

    const { followed_id } = await request.json()

    if (!followed_id) {
      return NextResponse.json(
        { error: 'followed_id is required' },
        { status: 400 }
      )
    }

    // 自分自身をフォローすることを防ぐ
    if (followed_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // フォロー対象のユーザーが存在するかチェック
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', followed_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 既にフォローしているかチェック
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followed_id', followed_id)
      .single()

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      )
    }

    // フォロー関係を作成
    const { data: follow, error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        followed_id: followed_id
      })
      .select(`
        *,
        follower:follower_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        followed:followed_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating follow:', error)
      return NextResponse.json(
        { error: 'Failed to follow user' },
        { status: 500 }
      )
    }

    return NextResponse.json(follow, { status: 201 })
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

    const { followed_id } = await request.json()

    if (!followed_id) {
      return NextResponse.json(
        { error: 'followed_id is required' },
        { status: 400 }
      )
    }

    // フォロー関係を削除
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followed_id', followed_id)

    if (error) {
      console.error('Error deleting follow:', error)
      return NextResponse.json(
        { error: 'Failed to unfollow user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Successfully unfollowed user' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}