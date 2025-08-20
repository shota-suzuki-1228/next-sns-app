import { createClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

// 特定ユーザーのフォロワー一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, response } = createClient(request)

  try {
    // ユーザーが存在するかチェック
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // フォロワー一覧を取得
    const { data: followers, error } = await supabase
      .from('follows')
      .select(`
        *,
        follower:follower_id (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('followed_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching followers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch followers' },
        { status: 500 }
      )
    }

    return NextResponse.json(followers || [])
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}