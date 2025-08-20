'use client'

import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  initialLiked: boolean
  initialCount: number
  className?: string
}

export function LikeButton({ postId, initialLiked, initialCount, className }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleLike = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(true)

    try {
      const method = liked ? 'DELETE' : 'POST'
      const response = await fetch('/api/likes', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: postId }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      setLiked(data.liked)
      setCount(data.count)
    } catch (error) {
      console.error('Error toggling like:', error)
      // エラーの場合は状態を元に戻す
      setLiked(liked)
      setCount(count)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "text-gray-500 hover:text-red-500 transition-colors",
        liked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart 
        className={cn(
          "w-4 h-4 mr-1 transition-all",
          liked && "fill-current"
        )} 
      />
      <span className="text-sm">{count}</span>
    </Button>
  )
}