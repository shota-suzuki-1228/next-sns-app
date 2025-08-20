# チケット #05: 記事投稿・表示機能実装

## 概要
Markdownエディタを使用した記事投稿機能、タイムライン表示、記事詳細ページ、画像アップロード機能を実装する。

## TODO
- [ ] Markdownエディタコンポーネント実装
- [ ] 記事投稿フォーム実装
- [ ] タイムライン（記事一覧）実装
- [ ] 記事詳細ページ実装
- [ ] 画像アップロード機能実装
- [ ] 記事編集機能実装
- [ ] 記事削除機能実装
- [ ] カテゴリ・タグ選択機能実装
- [ ] 下書き機能実装（オプション）

## 詳細実装

### 1. Markdownエディタコンポーネント

#### components/markdown/markdown-editor.tsx
```typescript
'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownPreview } from './markdown-preview'
import { ImageUpload } from './image-upload'
import { Bold, Italic, Link, Image, List, Code, Eye, Edit } from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "記事を書いてください...",
  className
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState('edit')

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = document.querySelector('textarea[data-markdown-editor]') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)
    
    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }, [value, onChange])

  const insertImage = useCallback((url: string, alt: string = '') => {
    insertText(`![${alt}](${url})`)
  }, [insertText])

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              編集
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              プレビュー
            </TabsTrigger>
          </TabsList>

          {activeTab === 'edit' && (
            <div className="flex items-center gap-1 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('**', '**')}
                title="太字"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('*', '*')}
                title="斜体"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('[', '](url)')}
                title="リンク"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('`', '`')}
                title="コード"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('- ')}
                title="リスト"
              >
                <List className="h-4 w-4" />
              </Button>
              <ImageUpload onUpload={insertImage}>
                <Button variant="ghost" size="sm" title="画像">
                  <Image className="h-4 w-4" />
                </Button>
              </ImageUpload>
            </div>
          )}
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            data-markdown-editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] resize-none border-0 focus:ring-0"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="min-h-[400px] border rounded-md p-4">
            <MarkdownPreview content={value} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### components/markdown/markdown-preview.tsx
```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <div className="text-muted-foreground italic">
        プレビューする内容がありません
      </div>
    )
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="max-w-full h-auto rounded-lg" />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

#### components/markdown/image-upload.tsx
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'

interface ImageUploadProps {
  onUpload: (url: string, alt?: string) => void
  children: React.ReactNode
}

export function ImageUpload({ onUpload, children }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "エラー",
        description: "ファイルサイズは5MB以下にしてください",
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

    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `posts/${fileName}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      onUpload(publicUrl, file.name)

      toast({
        title: "成功",
        description: "画像がアップロードされました",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "エラー",
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // inputをリセット
      event.target.value = ''
    }
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
        disabled={isUploading}
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        {isUploading ? <LoadingSpinner size="sm" /> : children}
      </label>
    </>
  )
}
```

### 2. 記事投稿フォーム

#### components/posts/post-create-form.tsx
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MarkdownEditor } from '@/components/markdown/markdown-editor'
import { useToast } from '@/components/ui/use-toast'
import { createPost } from '../actions'
import { X } from 'lucide-react'

interface PostCreateFormProps {
  categories: Array<{ id: string; name: string }>
  tags: Array<{ id: string; name: string }>
}

export function PostCreateForm({ categories, tags }: PostCreateFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (formData: FormData) => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "エラー",
        description: "タイトルと本文は必須です",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      formData.append('title', title)
      formData.append('content', content)
      if (selectedCategory) {
        formData.append('categoryId', selectedCategory)
      }
      selectedTags.forEach(tag => formData.append('tags', tag))

      await createPost(formData)

      toast({
        title: "成功",
        description: "記事を投稿しました",
      })

      router.push('/')
    } catch (error) {
      console.error('Post creation error:', error)
      toast({
        title: "エラー",
        description: "記事の投稿に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規投稿</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="記事のタイトル"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>カテゴリ</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>タグ</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>本文</Label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              className="mt-2 border rounded-md"
            />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "投稿中..." : "投稿する"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 3. 記事表示コンポーネント

#### components/posts/post-card.tsx
```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkdownPreview } from '@/components/markdown/markdown-preview'
import { Heart, MessageCircle, Repeat, Share, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    excerpt?: string
    image_url?: string
    created_at: string
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
    categories?: {
      name: string
      color: string
    }
    _count?: {
      likes: number
      comments: number
      reposts: number
    }
  }
  showContent?: boolean
}

export function PostCard({ post, showContent = false }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ja,
  })

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Link href={`/profile/${post.profiles.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles.avatar_url} />
              <AvatarFallback>
                {post.profiles.display_name?.charAt(0) || post.profiles.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            {/* ヘッダー */}
            <div className="flex items-center space-x-2 mb-2">
              <Link
                href={`/profile/${post.profiles.username}`}
                className="font-semibold hover:underline"
              >
                {post.profiles.display_name}
              </Link>
              <span className="text-muted-foreground">@{post.profiles.username}</span>
              <span className="text-muted-foreground">·</span>
              <time className="text-muted-foreground text-sm">{timeAgo}</time>
            </div>

            {/* カテゴリ */}
            {post.categories && (
              <Badge
                variant="secondary"
                className="mb-2"
                style={{ backgroundColor: post.categories.color + '20', color: post.categories.color }}
              >
                {post.categories.name}
              </Badge>
            )}

            {/* タイトル */}
            <Link href={`/post/${post.id}`}>
              <h3 className="text-lg font-semibold mb-2 hover:underline">
                {post.title}
              </h3>
            </Link>

            {/* 本文または抜粋 */}
            <div className="mb-3">
              {showContent ? (
                <MarkdownPreview content={post.content} />
              ) : (
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt || post.content.substring(0, 200) + '...'}
                </p>
              )}
            </div>

            {/* 画像 */}
            {post.image_url && (
              <div className="mb-3">
                <img
                  src={post.image_url}
                  alt=""
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}

            {/* アクション */}
            <div className="flex items-center justify-between max-w-md">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                <MessageCircle className="h-4 w-4 mr-1" />
                {post._count?.comments || 0}
              </Button>

              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                <Repeat className="h-4 w-4 mr-1" />
                {post._count?.reposts || 0}
              </Button>

              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                <Heart className="h-4 w-4 mr-1" />
                {post._count?.likes || 0}
              </Button>

              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Share className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### components/posts/post-timeline.tsx
```typescript
import { PostCard } from './post-card'
import { PostSkeleton } from '@/components/ui/post-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'

interface PostTimelineProps {
  posts: any[]
  loading?: boolean
}

export function PostTimeline({ posts, loading }: PostTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="投稿がありません"
        description="まだ投稿された記事がありません。最初の投稿をしてみましょう！"
        action={{
          label: "新規投稿",
          href: "/create"
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### 4. Server Actions

#### app/actions.ts
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以下にしてください'),
  content: z.string().min(1, '本文は必須です'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function createPost(formData: FormData) {
  const user = await requireAuth()
  const supabase = await createClient()

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    categoryId: formData.get('categoryId') as string || undefined,
    tags: formData.getAll('tags') as string[],
  }

  const validatedData = PostSchema.parse(rawData)

  // 抜粋を生成（最初の200文字から）
  const excerpt = validatedData.content
    .replace(/[#*`\[\]()]/g, '') // Markdown記号を除去
    .substring(0, 200)
    .trim() + (validatedData.content.length > 200 ? '...' : '')

  // 投稿作成
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title: validatedData.title,
      content: validatedData.content,
      excerpt,
      category_id: validatedData.categoryId,
    })
    .select()
    .single()

  if (postError) {
    console.error('Post creation error:', postError)
    throw new Error('記事の作成に失敗しました')
  }

  // タグの関連付け
  if (validatedData.tags && validatedData.tags.length > 0) {
    const tagRelations = validatedData.tags.map(tagId => ({
      post_id: post.id,
      tag_id: tagId,
    }))

    const { error: tagError } = await supabase
      .from('post_tags')
      .insert(tagRelations)

    if (tagError) {
      console.error('Tag relation error:', tagError)
      // タグエラーは無視してそのまま進む
    }
  }

  redirect(`/post/${post.id}`)
}
```

## 完了条件
- [ ] Markdownエディタが正常に動作する
- [ ] 画像アップロード機能が正常に動作する
- [ ] 記事投稿が正常に行える
- [ ] タイムラインで記事一覧が表示される
- [ ] 記事詳細ページが正常に表示される
- [ ] カテゴリ・タグ機能が正常に動作する
- [ ] レスポンシブデザインが適切に表示される

## 関連チケット
- 前: #04 基本UIコンポーネント・レイアウト実装
- 次: #06 ソーシャル機能実装
- 依存: #04の完了が必要

## 注意事項
- ファイルサイズ制限（5MB）を適切に設定
- XSS対策のためMarkdown内容を適切にサニタイズ
- 画像の最適化を考慮

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
記事機能はアプリの中核。UXを重視した実装を心がける。