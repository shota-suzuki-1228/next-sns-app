import { createClient } from '@/lib/supabase/route-handler'
import { Database } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

type PostUpdate = Database['public']['Tables']['posts']['Update']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, response } = createClient(request)

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url,
          bio
        ),
        categories (
          id,
          name,
          slug
        ),
        post_tags (
          tags (
            id,
            name,
            slug
          )
        ),
        likes:likes(count),
        comments:comments(count),
        reposts:reposts(count)
      `)
      .eq('id', id)
      .eq('published', true)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, response } = createClient(request)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const updateData: PostUpdate = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || null,
      category_id: body.category_id || null,
      published: body.published,
      updated_at: new Date().toISOString(),
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .eq('author_id', user.id)
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories (
          id,
          name,
          slug
        )
      `)
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json(
        { error: 'Failed to update post or unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, response } = createClient(request)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json(
        { error: 'Failed to delete post or unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}