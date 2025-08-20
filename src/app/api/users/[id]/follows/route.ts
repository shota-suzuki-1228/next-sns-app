import { createClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

// 特定ユーザーがフォローしているユーザー一覧を取得
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

    // フォロー中のユーザー一覧を取得
    const { data: follows, error } = await supabase
      .from('follows')
      .select(`
        *,
        followed:followed_id (
          id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('follower_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching follows:', error)
      return NextResponse.json(
        { error: 'Failed to fetch follows' },
        { status: 500 }
      )
    }

    return NextResponse.json(follows || [])
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}