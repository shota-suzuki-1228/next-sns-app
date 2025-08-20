import { createClient } from '@/lib/supabase/server'
import { PostCard } from './post-card'
import { Database } from '@/types/database'

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
  user_following?: boolean
}

export async function FollowingTimeline() {
  const supabase = await createClient()
  
  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">ログインしてフォロー中のユーザーの投稿を見る</p>
      </div>
    )
  }

  // フォロー中のユーザーIDを取得
  const { data: follows } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', user.id)

  const followedUserIds = follows?.map(follow => follow.followed_id) || []

  if (followedUserIds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">フォロー中のユーザーがいません。</p>
        <p className="text-sm text-gray-500">
          興味のあるユーザーをフォローして、タイムラインを充実させましょう！
        </p>
      </div>
    )
  }

  // フォロー中のユーザーの投稿を取得
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
      )
    `)
    .in('author_id', followedUserIds)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching following posts:', error)
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">投稿の取得に失敗しました。</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">フォロー中のユーザーの新しい投稿がありません。</p>
        <p className="text-sm text-gray-500">
          しばらく時間をおいて確認してみてください。
        </p>
      </div>
    )
  }

  // 各投稿のいいね数、コメント数、リポスト数、現在ユーザーの状態を取得
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
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

  return (
    <div className="space-y-4">
      {postsWithCounts.map((post) => (
        <PostCard key={post.id} post={post as PostWithAuthor} />
      ))}
    </div>
  )
}