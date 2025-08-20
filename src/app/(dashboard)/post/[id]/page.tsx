import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle, Share } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Database } from '@/types/database'
import { LikeButton } from '@/components/posts/like-button'
import { RepostButton } from '@/components/posts/repost-button'
import { CommentForm } from '@/components/posts/comment-form'
import { CommentList } from '@/components/posts/comment-list'
import { Suspense } from 'react'

type PostWithAuthor = Database['public']['Tables']['posts']['Row'] & {
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }
  categories?: {
    id: string
    name: string
    slug: string
  } | null
  post_tags?: {
    tags: {
      id: string
      name: string
      slug: string
    }
  }[]
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser()

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
      )
    `)
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error || !post) {
    notFound()
  }

  // いいね数を取得
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)

  // コメント数を取得
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)

  // リポスト数を取得
  const { count: repostsCount } = await supabase
    .from('reposts')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)

  // 現在ユーザーのいいね状態とリポスト状態を取得
  let userLiked = false
  let userReposted = false
  if (user) {
    const { data: userLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()
    
    const { data: userRepost } = await supabase
      .from('reposts')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()
    
    userLiked = !!userLike
    userReposted = !!userRepost
  }

  const typedPost = post as PostWithAuthor
  const author = typedPost.profiles

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm">
          <article className="p-8">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <Avatar className="w-12 h-12">
                  {author.avatar_url ? (
                    <img 
                      src={author.avatar_url} 
                      alt={author.display_name || author.username}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-full">
                      <span className="text-lg font-medium text-gray-600">
                        {(author.display_name || author.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {author.display_name || author.username}
                  </h3>
                  <p className="text-sm text-gray-500">@{author.username}</p>
                </div>
              </div>

              {typedPost.category_id && typedPost.categories && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {typedPost.categories.name}
                  </span>
                </div>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {typedPost.title}
              </h1>

              <div className="flex items-center text-sm text-gray-500 mb-6">
                <span>投稿日: {formatDate(typedPost.created_at)}</span>
                {typedPost.updated_at !== typedPost.created_at && (
                  <>
                    <span className="mx-2">·</span>
                    <span>更新日: {formatDate(typedPost.updated_at)}</span>
                  </>
                )}
              </div>

              {typedPost.post_tags && typedPost.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {typedPost.post_tags.map((postTag) => (
                    <span
                      key={postTag.tags.id}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
                    >
                      #{postTag.tags.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none mb-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {typedPost.content}
              </ReactMarkdown>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <LikeButton 
                  postId={typedPost.id}
                  initialLiked={userLiked}
                  initialCount={likesCount || 0}
                  className="text-gray-500 hover:text-red-500"
                />
                
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span>コメント ({commentsCount || 0})</span>
                </Button>
                
                <RepostButton 
                  postId={typedPost.id}
                  initialReposted={userReposted}
                  initialCount={repostsCount || 0}
                  className="text-gray-500 hover:text-green-500"
                />
                
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Share className="w-5 h-5 mr-2" />
                  <span>シェア</span>
                </Button>
              </div>
              
              <Link href="/">
                <Button variant="outline">タイムラインに戻る</Button>
              </Link>
            </div>
          </article>
        </div>

        {/* コメント機能 */}
        <div id="comments" className="bg-white rounded-lg shadow-sm mt-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              コメント ({commentsCount || 0})
            </h3>
            <CommentForm 
              postId={typedPost.id} 
            />
          </div>
          
          <div className="p-6">
            <Suspense fallback={
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <CommentList postId={typedPost.id} />
            </Suspense>
          </div>
        </div>

        {author.bio && (
          <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">著者について</h3>
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12 flex-shrink-0">
                {author.avatar_url ? (
                  <img 
                    src={author.avatar_url} 
                    alt={author.display_name || author.username}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-full">
                    <span className="text-lg font-medium text-gray-600">
                      {(author.display_name || author.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Avatar>
              <div>
                <h4 className="font-medium text-gray-900">
                  {author.display_name || author.username}
                </h4>
                <p className="text-gray-600 mt-1">{author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}