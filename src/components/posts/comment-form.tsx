'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'

interface CommentFormProps {
  postId: string
  placeholder?: string
  buttonText?: string
}

export function CommentForm({ 
  postId, 
  placeholder = "コメントを入力...",
  buttonText = "コメント投稿"
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      router.push('/login')
      return
    }

    if (!content.trim()) {
      setError('コメント内容を入力してください')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          content: content.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'コメントの投稿に失敗しました')
      }

      setContent('')
      // ページをリロードしてコメントを表示
      window.location.reload()
    } catch (error) {
      console.error('Error creating comment:', error)
      setError(error instanceof Error ? error.message : 'コメントの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600 mb-3">コメントを投稿するにはログインが必要です</p>
        <Button onClick={() => router.push('/login')} variant="outline">
          ログイン
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            {user.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt={user.user_metadata?.display_name || user.email}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-full">
                <span className="text-sm font-medium text-gray-600">
                  {(user.user_metadata?.display_name || user.email || '').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Avatar>

          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full resize-none border-0 p-0 focus:ring-0 focus:border-0 shadow-none"
              rows={3}
              maxLength={1000}
            />
            
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-500">
                {content.length}/1000
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                size="sm"
              >
                {isSubmitting ? '投稿中...' : buttonText}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}