'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  userId: string
  initialFollowing: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showIcon?: boolean
}

export function FollowButton({ 
  userId,
  initialFollowing,
  size = 'default',
  variant = 'default',
  className,
  showIcon = true
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // 自分自身の場合はボタンを表示しない
  if (user && user.id === userId) {
    return null
  }

  const handleFollow = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    
    try {
      if (isFollowing) {
        // フォロー解除
        const response = await fetch('/api/follows', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followed_id: userId })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'フォロー解除に失敗しました')
        }

        setIsFollowing(false)
        
        // ページをリロードして他の投稿のフォロー状態も更新
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        // フォロー
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followed_id: userId })
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 409) {
            // 既にフォロー済み
            setIsFollowing(true)
            return
          }
          throw new Error(errorData.error || 'フォローに失敗しました')
        }

        setIsFollowing(true)
        
        // ページをリロードして他の投稿のフォロー状態も更新
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      // エラー時は状態を元に戻す
      if (isFollowing) {
        setIsFollowing(true)
      } else {
        setIsFollowing(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => router.push('/login')}
        className={cn(className)}
      >
        {showIcon && <UserPlus className="w-4 h-4 mr-2" />}
        ログインしてフォロー
      </Button>
    )
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isFollowing && "hover:bg-red-50 hover:border-red-200 hover:text-red-600",
        className
      )}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
          処理中...
        </>
      ) : isFollowing ? (
        <>
          {showIcon && <UserMinus className="w-4 h-4 mr-2" />}
          <span className="group-hover:hidden">フォロー中</span>
          <span className="hidden group-hover:inline">フォロー解除</span>
        </>
      ) : (
        <>
          {showIcon && <UserPlus className="w-4 h-4 mr-2" />}
          フォロー
        </>
      )}
    </Button>
  )
}