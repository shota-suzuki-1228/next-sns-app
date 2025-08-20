'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Repeat2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface RepostButtonProps {
  postId: string
  initialReposted: boolean
  initialCount: number
  className?: string
}

export function RepostButton({ 
  postId, 
  initialReposted, 
  initialCount, 
  className 
}: RepostButtonProps) {
  const [reposted, setReposted] = useState(initialReposted)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleRepost = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    
    try {
      if (reposted) {
        // リポストを削除
        const response = await fetch('/api/reposts', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post_id: postId })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'リポストの削除に失敗しました')
        }

        setReposted(false)
        setCount(prev => Math.max(0, prev - 1))
      } else {
        // リポストを作成
        const response = await fetch('/api/reposts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post_id: postId })
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 409) {
            // 既にリポスト済み
            setReposted(true)
            return
          }
          throw new Error(errorData.error || 'リポストに失敗しました')
        }

        setReposted(true)
        setCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling repost:', error)
      // エラー時は状態を元に戻す
      if (reposted) {
        setReposted(true)
        setCount(prev => prev + 1)
      } else {
        setReposted(false)
        setCount(prev => Math.max(0, prev - 1))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRepost}
      disabled={isLoading}
      className={cn(
        "text-gray-500 hover:text-green-500 transition-colors",
        reposted && "text-green-600 hover:text-green-700",
        className
      )}
    >
      <Repeat2 
        className={cn(
          "w-4 h-4 mr-1 transition-transform",
          isLoading && "animate-spin",
          reposted && "text-green-600"
        )} 
      />
      <span className={cn(
        "text-sm transition-colors",
        reposted && "text-green-600 font-medium"
      )}>
        {count}
      </span>
    </Button>
  )
}