'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PostCreateFormProps {
  onSubmit: (formData: FormData) => void
  isSubmitting?: boolean
}

export function PostCreateForm({ onSubmit, isSubmitting = false }: PostCreateFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            placeholder="投稿のタイトルを入力"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">内容（Markdown対応）</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '編集' : 'プレビュー'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {!showPreview ? (
              <Textarea
                id="content"
                name="content"
                required
                placeholder="Markdownで内容を記述してください&#10;&#10;例：&#10;# 見出し&#10;**太字** *斜体*&#10;&#10;- リスト1&#10;- リスト2&#10;&#10;```javascript&#10;console.log('Hello World')&#10;```"
                className="min-h-[400px] font-mono"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="min-h-[400px] p-4 border rounded-md bg-muted/20">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*プレビューするコンテンツがありません*'}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              const formData = new FormData()
              formData.set('title', title)
              formData.set('content', content)
              formData.set('draft', 'true')
              onSubmit(formData)
            }}
          >
            {isSubmitting ? '保存中...' : '下書き保存'}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '投稿中...' : '投稿する'}
          </Button>
        </div>
      </form>
    </div>
  )
}