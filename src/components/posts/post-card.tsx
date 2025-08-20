import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle, Share } from 'lucide-react'
import { Database } from '@/types/database'
import { LikeButton } from './like-button'
import { RepostButton } from './repost-button'
import { FollowButton } from '@/components/users/follow-button'

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

interface PostCardProps {
  post: PostWithAuthor
  showActions?: boolean
}

export function PostCard({ post, showActions = true }: PostCardProps) {
  const author = post.profiles
  const likesCount = post.likes_count || 0
  const userLiked = post.user_liked || false
  const commentsCount = post.comments_count || 0
  const repostsCount = post.reposts_count || 0
  const userReposted = post.user_reposted || false
  const userFollowing = post.user_following || false

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours}時間前`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays}日前`
    }
    
    return date.toLocaleDateString('ja-JP')
  }

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          {author.avatar_url ? (
            <img 
              src={author.avatar_url} 
              alt={author.display_name || author.username}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-full">
              <span className="text-sm font-medium text-gray-600">
                {(author.display_name || author.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Link href={`/profile/${author.username}`}>
                <h3 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                  {author.display_name || author.username}
                </h3>
              </Link>
              <Link href={`/profile/${author.username}`}>
                <span className="text-sm text-gray-500 hover:text-blue-600">@{author.username}</span>
              </Link>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
            </div>
            
            <FollowButton 
              userId={author.id}
              initialFollowing={userFollowing}
              size="sm"
              variant="outline"
              showIcon={false}
              className="ml-2"
            />
          </div>

          {post.category_id && post.categories && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {post.categories.name}
              </span>
            </div>
          )}

          <Link href={`/post/${post.id}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
              {post.title}
            </h2>
          </Link>

          {post.excerpt && (
            <p className="text-gray-600 mb-3 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {post.post_tags && post.post_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.post_tags.map((postTag) => (
                <span
                  key={postTag.tags.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  #{postTag.tags.name}
                </span>
              ))}
            </div>
          )}

          {showActions && (
            <div className="flex items-center space-x-6 pt-3 border-t">
              <LikeButton 
                postId={post.id}
                initialLiked={userLiked}
                initialCount={likesCount}
              />
              
              <Link href={`/post/${post.id}#comments`}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-blue-500"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{commentsCount}</span>
                </Button>
              </Link>
              
              <RepostButton 
                postId={post.id}
                initialReposted={userReposted}
                initialCount={repostsCount}
              />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700"
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}