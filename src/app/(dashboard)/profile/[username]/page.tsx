import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/types/database'
import { FollowButton } from '@/components/users/follow-button'
import { PostCard } from '@/components/posts/post-card'
import { Suspense } from 'react'

type Profile = Database['public']['Tables']['profiles']['Row']

type PostWithAuthor = Database['public']['Tables']['posts']['Row'] & {
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
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
  likes_count?: number
  user_liked?: boolean
  comments_count?: number
  reposts_count?: number
  user_reposted?: boolean
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  
  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser()

  // プロフィール情報を取得
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // フォロワー数とフォロー中数を取得
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followed_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  // 現在ユーザーがこのプロフィールをフォローしているかチェック
  let isFollowing = false
  if (user && user.id !== profile.id) {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followed_id', profile.id)
      .single()
    
    isFollowing = !!followData
  }

  // ユーザーの投稿を取得
  const { data: posts } = await supabase
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
      )
    `)
    .eq('author_id', profile.id)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // 各投稿のいいね数、コメント数、リポスト数、現在ユーザーの状態を取得
  const postsWithCounts = await Promise.all(
    (posts || []).map(async (post) => {
      // いいね数を取得
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      // コメント数を取得
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      // リポスト数を取得
      const { count: repostsCount } = await supabase
        .from('reposts')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      // 現在ユーザーのいいね状態、リポスト状態、フォロー状態を取得
      let userLiked = false
      let userReposted = false
      let userFollowing = false
      if (user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single()

        const { data: userRepost } = await supabase
          .from('reposts')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single()

        const { data: userFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('followed_id', post.author_id)
          .single()
        
        userLiked = !!userLike
        userReposted = !!userRepost
        userFollowing = !!userFollow
      }

      return {
        ...post,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        reposts_count: repostsCount || 0,
        user_liked: userLiked,
        user_reposted: userReposted,
        user_following: userFollowing
      }
    })
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.display_name || profile.username}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-full">
                      <span className="text-2xl font-medium text-gray-600">
                        {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-gray-500 mb-2">@{profile.username}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(profile.created_at)}に参加
                    </div>
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website_url && (
                      <a 
                        href={profile.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <LinkIcon className="w-4 h-4 mr-1" />
                        ウェブサイト
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {user && user.id === profile.id ? (
                  <Link href="/profile/edit">
                    <Button variant="outline">プロフィール編集</Button>
                  </Link>
                ) : (
                  <FollowButton 
                    userId={profile.id}
                    initialFollowing={isFollowing}
                  />
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-700 mb-4">{profile.bio}</p>
            )}

            <div className="flex items-center space-x-6 text-sm">
              <Link 
                href={`/profile/${username}/following`}
                className="hover:text-blue-600 transition-colors"
              >
                <span className="font-semibold text-gray-900">{followingCount || 0}</span>
                <span className="text-gray-500 ml-1">フォロー中</span>
              </Link>
              <Link 
                href={`/profile/${username}/followers`}
                className="hover:text-blue-600 transition-colors"
              >
                <span className="font-semibold text-gray-900">{followersCount || 0}</span>
                <span className="text-gray-500 ml-1">フォロワー</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 投稿一覧 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              投稿
            </h2>
          </div>
          
          {postsWithCounts.length > 0 ? (
            postsWithCounts.map((post) => (
              <PostCard key={post.id} post={post as PostWithAuthor} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600 mb-2">まだ投稿がありません</p>
              {user && user.id === profile.id && (
                <Link href="/post/create">
                  <Button>最初の投稿を作成</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}