# チケット #06: ソーシャル機能実装

## 概要
いいね、リツイート、コメント、フォロー機能を実装。リアルタイム更新にも対応する。

## TODO
- [ ] いいね機能実装（リアルタイム更新対応）
- [ ] リツイート機能実装
- [ ] コメント機能実装
- [ ] フォロー・アンフォロー機能実装
- [ ] 通知機能基盤実装
- [ ] リアルタイム購読機能実装
- [ ] ソーシャル統計表示実装
- [ ] ユーザー推薦機能実装（オプション）

## 詳細実装

### 1. いいね機能

#### components/social/like-button.tsx
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  initialLikes: number
  initialIsLiked: boolean
}

export function LikeButton({ postId, initialLikes, initialIsLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    // リアルタイムでいいね数を購読
    const channel = supabase
      .channel(`likes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikes(prev => prev + 1)
            if (payload.new.user_id === user.id) {
              setIsLiked(true)
            }
          } else if (payload.eventType === 'DELETE') {
            setLikes(prev => prev - 1)
            if (payload.old.user_id === user.id) {
              setIsLiked(false)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, user, supabase])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "ログインが必要です",
        description: "いいねするにはログインしてください",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isLiked) {
        // いいね削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // いいね追加
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Like error:', error)
      toast({
        title: "エラー",
        description: "いいねの処理に失敗しました",
        variant: "destructive",
      })
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
        "text-muted-foreground hover:text-red-500",
        isLiked && "text-red-500"
      )}
    >
      <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
      {likes}
    </Button>
  )
}
```

### 2. コメント機能

#### components/social/comment-section.tsx
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  // コメント取得
  useEffect(() => {
    fetchComments()
  }, [postId])

  // リアルタイム購読
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // 新しいコメントの詳細情報を取得
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              profiles (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setComments(prev => [data, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !newComment.trim()) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      toast({
        title: "成功",
        description: "コメントを投稿しました",
      })
    } catch (error) {
      console.error('Comment submission error:', error)
      toast({
        title: "エラー",
        description: "コメントの投稿に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">コメントを読み込み中...</div>
  }

  return (
    <div className="space-y-4">
      {/* コメント投稿フォーム */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.display_name?.charAt(0) || profile?.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを入力..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? "投稿中..." : "コメント"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* コメント一覧 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            まだコメントがありません
          </p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback>
                      {comment.profiles.display_name?.charAt(0) || comment.profiles.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.profiles.display_name}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        @{comment.profiles.username}
                      </span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <time className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </time>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
```

### 3. フォロー機能

#### components/social/follow-button.tsx
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/components/ui/use-toast'
import { UserPlus, UserCheck } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
  className?: string
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  className
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "ログインが必要です",
        description: "フォローするにはログインしてください",
        variant: "destructive",
      })
      return
    }

    if (user.id === targetUserId) return

    setIsLoading(true)

    try {
      if (isFollowing) {
        // アンフォロー
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        if (error) throw error
        setIsFollowing(false)
        
        toast({
          title: "アンフォローしました",
        })
      } else {
        // フォロー
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          })

        if (error) throw error
        setIsFollowing(true)
        
        toast({
          title: "フォローしました",
        })
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast({
        title: "エラー",
        description: "フォロー操作に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.id === targetUserId) return null

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={className}
    >
      {isLoading ? (
        "処理中..."
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          フォロー中
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          フォロー
        </>
      )}
    </Button>
  )
}
```

### 4. Server Actions

#### app/social/actions.ts
```typescript
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

// リツイート機能
export async function toggleRepost(postId: string, comment?: string) {
  const user = await requireAuth()
  const supabase = await createClient()

  // 既存のリツイートをチェック
  const { data: existing } = await supabase
    .from('reposts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // リツイート解除
    const { error } = await supabase
      .from('reposts')
      .delete()
      .eq('id', existing.id)

    if (error) throw error
  } else {
    // リツイート
    const { error } = await supabase
      .from('reposts')
      .insert({
        post_id: postId,
        user_id: user.id,
        comment: comment || null,
      })

    if (error) throw error
  }

  revalidatePath('/')
  revalidatePath(`/post/${postId}`)
}

// 通知作成（フォロー、いいね、コメント時）
export async function createNotification(
  userId: string,
  type: 'follow' | 'like' | 'comment' | 'repost',
  postId?: string
) {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // 自分に対する通知は作成しない
  if (currentUser.id === userId) return

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      from_user_id: currentUser.id,
      type,
      post_id: postId,
    })

  if (error) console.error('Notification creation error:', error)
}
```

## 完了条件
- [ ] いいね機能が正常に動作する
- [ ] コメント機能が正常に動作する
- [ ] フォロー・アンフォロー機能が正常に動作する
- [ ] リツイート機能が正常に動作する
- [ ] リアルタイム更新が正常に動作する
- [ ] 通知システムが基本的に動作する
- [ ] パフォーマンスが適切である

## 関連チケット
- 前: #05 記事投稿・表示機能実装
- 次: #07 検索・カテゴリ・タグ機能実装
- 依存: #05の完了が必要

## 注意事項
- リアルタイム購読のメモリリーク対策
- 適切なエラーハンドリング
- スパム防止対策

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
ソーシャル機能はユーザーエンゲージメントの要。リアルタイム性を重視。