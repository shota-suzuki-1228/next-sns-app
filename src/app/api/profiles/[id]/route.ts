import { createClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, response } = createClient(request)
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 更新するプロフィールがログイン中のユーザーのものかチェック
    if (user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      )
    }

    // リクエストボディを取得
    const body = await request.json()
    const { display_name, bio, location, website_url } = body

    // 入力値のバリデーション
    const errors: string[] = []

    if (display_name && display_name.length > 50) {
      errors.push('表示名は50文字以内で入力してください')
    }

    if (bio && bio.length > 160) {
      errors.push('自己紹介は160文字以内で入力してください')
    }

    if (location && location.length > 30) {
      errors.push('場所は30文字以内で入力してください')
    }

    if (website_url && website_url.length > 255) {
      errors.push('ウェブサイトURLは255文字以内で入力してください')
    }

    // URLの形式チェック（簡易版）
    if (website_url && website_url.trim() !== '') {
      try {
        new URL(website_url)
      } catch {
        errors.push('有効なURLを入力してください')
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // プロフィールを更新
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: display_name || null,
        bio: bio || null,
        location: location || null,
        website_url: website_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase } = createClient(request)
    
    // プロフィール情報を取得
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}