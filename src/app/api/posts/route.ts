import { createClient } from '@/lib/supabase/route-handler'
import { Database } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

type Post = Database['public']['Tables']['posts']['Row']
type PostInsert = Database['public']['Tables']['posts']['Insert']

export async function GET(request: NextRequest) {
  const { supabase, response } = createClient(request)

  try {
    const { data: posts, error } = await supabase
      .from('posts')
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
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    
    const postData: PostInsert = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || null,
      author_id: user.id,
      category_id: body.category_id || null,
      published: body.published || false,
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert(postData)
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
      console.error('Error creating post:', error)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}