# チケット #08: ユーザープロフィール機能実装

## 概要
ユーザープロフィールページ、プロフィール編集機能、ユーザー統計表示、フォロワー・フォロー中一覧を実装する。

## TODO
- [ ] プロフィールページ実装
- [ ] プロフィール編集フォーム実装
- [ ] アバター画像アップロード機能実装
- [ ] ユーザー統計表示（投稿数、フォロワー数など）
- [ ] ユーザーの投稿一覧表示
- [ ] フォロワー・フォロー中一覧ページ実装
- [ ] プロフィール設定ページ実装
- [ ] アカウント削除機能実装（オプション）
- [ ] プライバシー設定機能実装（オプション）

## 詳細実装

### 1. プロフィールページ

#### app/profile/[username]/page.tsx
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileTabs } from '@/components/profile/profile-tabs'
import { PostTimeline } from '@/components/posts/post-timeline'

interface ProfilePageProps {
  params: {
    username: string
  }
  searchParams: {
    tab?: 'posts' | 'likes' | 'reposts'
  }
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const supabase = await createClient()
  const { username } = params
  const activeTab = searchParams.tab || 'posts'

  // ユーザー情報を取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      _count: (
        SELECT COUNT(*) as posts FROM posts WHERE user_id = profiles.id AND published = true
      ),
      _count: (
        SELECT COUNT(*) as followers FROM follows WHERE following_id = profiles.id
      ),
      _count: (
        SELECT COUNT(*) as following FROM follows WHERE follower_id = profiles.id
      )
    `)
    .eq('username', username)
    .single()

  if (error || !profile) {
    notFound()
  }

  // 現在のユーザーがこのプロフィールをフォローしているかチェック
  const { data: { user } } = await supabase.auth.getUser()
  let isFollowing = false
  
  if (user && user.id !== profile.id) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single()
    
    isFollowing = !!follow
  }

  // タブに応じた投稿データを取得
  let posts = []
  
  if (activeTab === 'posts') {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url
        ),
        categories (
          name,
          color
        ),
        _count: (
          SELECT COUNT(*) as likes FROM likes WHERE post_id = posts.id
        ),
        _count: (
          SELECT COUNT(*) as comments FROM comments WHERE post_id = posts.id
        ),
        _count: (
          SELECT COUNT(*) as reposts FROM reposts WHERE post_id = posts.id
        )
      `)
      .eq('user_id', profile.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20)
    
    posts = data || []
  } else if (activeTab === 'likes') {
    const { data } = await supabase
      .from('likes')
      .select(`
        posts (
          *,
          profiles (
            username,
            display_name,
            avatar_url
          ),
          categories (
            name,
            color
          ),
          _count: (
            SELECT COUNT(*) as likes FROM likes WHERE post_id = posts.id
          ),
          _count: (
            SELECT COUNT(*) as comments FROM comments WHERE post_id = posts.id
          ),
          _count: (
            SELECT COUNT(*) as reposts FROM reposts WHERE post_id = posts.id
          )
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    posts = data?.map(like => like.posts).filter(Boolean) || []
  } else if (activeTab === 'reposts') {
    const { data } = await supabase
      .from('reposts')
      .select(`
        *,
        posts (
          *,
          profiles (
            username,
            display_name,
            avatar_url
          ),
          categories (
            name,
            color
          ),
          _count: (
            SELECT COUNT(*) as likes FROM likes WHERE post_id = posts.id
          ),
          _count: (
            SELECT COUNT(*) as comments FROM comments WHERE post_id = posts.id
          ),
          _count: (
            SELECT COUNT(*) as reposts FROM reposts WHERE post_id = posts.id
          )
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    posts = data?.map(repost => repost.posts).filter(Boolean) || []
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <ProfileHeader 
        profile={profile} 
        isFollowing={isFollowing}
        isOwnProfile={user?.id === profile.id}
      />
      <ProfileTabs activeTab={activeTab} username={username} />
      <div className="mt-6">
        <PostTimeline posts={posts} />
      </div>
    </div>
  )
}
```

### 2. プロフィールヘッダー

#### components/profile/profile-header.tsx
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/social/follow-button'
import { Calendar, MapPin, Link2, Settings } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ProfileHeaderProps {
  profile: {
    id: string
    username: string
    display_name: string
    bio?: string
    avatar_url?: string
    website_url?: string
    location?: string
    created_at: string
    _count: {
      posts: number
      followers: number
      following: number
    }
  }
  isFollowing: boolean
  isOwnProfile: boolean
}

export function ProfileHeader({ profile, isFollowing, isOwnProfile }: ProfileHeaderProps) {
  const joinedDate = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: true,
    locale: ja,
  })

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* プロフィール画像 */}
          <div className="flex justify-center md:justify-start">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.charAt(0) || profile.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1">
            {/* ユーザー情報 */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              <div className="mt-4 md:mt-0 flex gap-2">
                {isOwnProfile ? (
                  <Button variant="outline" asChild>
                    <Link href="/settings/profile">
                      <Settings className="h-4 w-4 mr-2" />
                      編集
                    </Link>
                  </Button>
                ) : (
                  <FollowButton
                    targetUserId={profile.id}
                    initialIsFollowing={isFollowing}
                  />
                )}
              </div>
            </div>

            {/* 自己紹介 */}
            {profile.bio && (
              <p className="text-sm mb-4 whitespace-pre-wrap">{profile.bio}</p>
            )}

            {/* 詳細情報 */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              {profile.website_url && (
                <div className="flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {new URL(profile.website_url).hostname}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {joinedDate}に参加
              </div>
            </div>

            {/* 統計 */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold">{profile._count.posts}</span>
                <span className="text-muted-foreground ml-1">投稿</span>
              </div>
              <Link
                href={`/profile/${profile.username}/following`}
                className="hover:underline"
              >
                <span className="font-semibold">{profile._count.following}</span>
                <span className="text-muted-foreground ml-1">フォロー中</span>
              </Link>
              <Link
                href={`/profile/${profile.username}/followers`}
                className="hover:underline"
              >
                <span className="font-semibold">{profile._count.followers}</span>
                <span className="text-muted-foreground ml-1">フォロワー</span>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. プロフィール編集

#### app/settings/profile/page.tsx
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/profile/profile-edit-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // 現在のプロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール編集</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  )
}
```

#### components/profile/profile-edit-form.tsx
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Camera } from 'lucide-react'

interface ProfileEditFormProps {
  profile: {
    id: string
    username: string
    display_name: string
    bio?: string
    avatar_url?: string
    website_url?: string
    location?: string
  }
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    username: profile.username || '',
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    website_url: profile.website_url || '',
    location: profile.location || '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar_url || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "エラー",
        description: "ファイルサイズは2MB以下にしてください",
        variant: "destructive",
      })
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast({
        title: "エラー",
        description: "画像ファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    setAvatarFile(file)
    
    // プレビュー用のURLを作成
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null

    setIsUploadingAvatar(true)

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar-${profile.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 既存のアバターがある場合は削除
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('images')
            .remove([`avatars/${oldPath}`])
        }
      }

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, avatarFile, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: "エラー",
        description: "アバターのアップロードに失敗しました",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // アバターのアップロード
      let avatarUrl = profile.avatar_url
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }

      // プロフィール更新
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio || null,
          website_url: formData.website_url || null,
          location: formData.location || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "成功",
        description: "プロフィールを更新しました",
      })

      // プロフィールページにリダイレクト
      router.push(`/profile/${formData.username}`)
      router.refresh()
    } catch (error: any) {
      console.error('Profile update error:', error)
      
      // ユーザー名の重複エラー
      if (error.code === '23505') {
        toast({
          title: "エラー",
          description: "このユーザー名は既に使用されています",
          variant: "destructive",
        })
      } else {
        toast({
          title: "エラー",
          description: "プロフィールの更新に失敗しました",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* アバター */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview} />
            <AvatarFallback className="text-lg">
              {formData.display_name?.charAt(0) || formData.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
            disabled={isUploadingAvatar}
          />
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          >
            {isUploadingAvatar ? (
              <LoadingSpinner className="text-white" size="sm" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </label>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            JPG、PNG形式のファイルをアップロードできます（最大2MB）
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">ユーザー名 *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            required
            pattern="^[a-zA-Z0-9_]+$"
            title="英数字とアンダースコアのみ使用できます"
          />
        </div>

        <div>
          <Label htmlFor="display_name">表示名 *</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">自己紹介</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={4}
          maxLength={200}
          placeholder="あなたについて教えてください..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.bio.length}/200文字
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">場所</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="東京, 日本"
          />
        </div>

        <div>
          <Label htmlFor="website_url">ウェブサイト</Label>
          <Input
            id="website_url"
            type="url"
            value={formData.website_url}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploadingAvatar}>
          {isSubmitting ? "更新中..." : "更新する"}
        </Button>
      </div>
    </form>
  )
}
```

### 4. フォロワー・フォロー中一覧

#### app/profile/[username]/followers/page.tsx
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserList } from '@/components/profile/user-list'

interface FollowersPageProps {
  params: {
    username: string
  }
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const supabase = await createClient()
  const { username } = params

  // ユーザー情報を取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .single()

  if (error || !profile) {
    notFound()
  }

  // フォロワー一覧を取得
  const { data: followers } = await supabase
    .from('follows')
    .select(`
      profiles!follows_follower_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `)
    .eq('following_id', profile.id)
    .order('created_at', { ascending: false })

  const followerProfiles = followers?.map(f => f.profiles).filter(Boolean) || []

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <h1 className="text-2xl font-bold mb-6">
        {profile.display_name}のフォロワー
      </h1>
      <UserList users={followerProfiles} />
    </div>
  )
}
```

#### components/profile/user-list.tsx
```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from '@/components/social/follow-button'
import Link from 'next/link'

interface UserListProps {
  users: Array<{
    id: string
    username: string
    display_name: string
    avatar_url?: string
    bio?: string
  }>
}

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">ユーザーが見つかりませんでした</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Link href={`/profile/${user.username}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.display_name?.charAt(0) || user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/profile/${user.username}`}
                      className="font-semibold hover:underline"
                    >
                      {user.display_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                  <FollowButton
                    targetUserId={user.id}
                    initialIsFollowing={false} // TODO: 実際の状態を取得
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

## 完了条件
- [ ] プロフィールページが正常に表示される
- [ ] プロフィール編集機能が正常に動作する
- [ ] アバター画像アップロードが正常に動作する
- [ ] ユーザー統計が正確に表示される
- [ ] フォロワー・フォロー中一覧が正常に表示される
- [ ] レスポンシブデザインが適切に表示される
- [ ] パフォーマンスが適切である

## 関連チケット
- 前: #07 検索・カテゴリ・タグ機能実装
- 次: #09 デプロイ・本番環境構築
- 依存: #07の完了が必要

## 注意事項
- 画像アップロードのセキュリティ対策
- ファイルサイズ制限の実装
- 適切な画像最適化

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
プロフィール機能はユーザーアイデンティティの要。使いやすさと個性表現のバランスを重視。