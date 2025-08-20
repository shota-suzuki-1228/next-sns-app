'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, MoreHorizontal, Reply } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  post_id: string
  parent_id: string | null
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface CommentListProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

export function CommentList({ postId, onCommentCountChange }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data = await response.json()
      setComments(data)
      
      // コメント数をカウントして通知
      const totalComments = data.reduce((count: number, comment: Comment) => {
        return count + 1 + (comment.replies?.length || 0)
      }, 0)
      onCommentCountChange?.(totalComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleReply = async (parentId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          content: replyContent.trim(),
          parent_id: parentId
        })
      })

      if (!response.ok) throw new Error('Failed to post reply')

      setReplyContent('')
      setReplyTo(null)
      await fetchComments()
    } catch (error) {
      console.error('Error posting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete comment')
      
      await fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

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
    
    return date.toLocaleDateString('ja-JP')
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex space-x-3 ${isReply ? 'ml-12 mt-3' : 'mb-4'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        {comment.profiles.avatar_url ? (
          <img 
            src={comment.profiles.avatar_url} 
            alt={comment.profiles.display_name || comment.profiles.username}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-gray-600">
              {(comment.profiles.display_name || comment.profiles.username).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {comment.profiles.display_name || comment.profiles.username}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(comment.created_at)}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-gray-400">編集済み</span>
          )}
        </div>

        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>

        <div className="flex items-center space-x-4">
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="text-xs text-gray-500 hover:text-blue-600"
            >
              <Reply className="w-3 h-3 mr-1" />
              返信
            </Button>
          )}

          {user && user.id === comment.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {replyTo === comment.id && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="返信を入力..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? '送信中...' : '返信'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyTo(null)
                  setReplyContent('')
                }}
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
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
    )
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>まだコメントがありません</p>
        <p className="text-sm">最初のコメントを投稿してみましょう！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  )
}