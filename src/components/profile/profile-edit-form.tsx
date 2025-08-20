'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, User, MapPin, Link as LinkIcon, FileText } from 'lucide-react'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileEditFormProps {
  profile: Profile
  onUpdate: (profile: Profile) => void
}

export function ProfileEditForm({ profile, onUpdate }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website_url: profile.website_url || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // エラーや成功メッセージをクリア
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          setError(data.details.join(', '))
        } else {
          setError(data.error || 'プロフィールの更新に失敗しました')
        }
        return
      }

      setSuccess(true)
      onUpdate(data.profile)

      // 3秒後に成功メッセージを非表示
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Profile update error:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>プロフィール編集</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 表示名 */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>表示名</span>
            </Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="表示名を入力してください"
              maxLength={50}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              {formData.display_name.length}/50文字
            </p>
          </div>

          {/* 自己紹介 */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>自己紹介</span>
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="自己紹介を入力してください"
              maxLength={160}
              rows={4}
              className="w-full resize-none"
            />
            <p className="text-sm text-gray-500">
              {formData.bio.length}/160文字
            </p>
          </div>

          {/* 場所 */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>場所</span>
            </Label>
            <Input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="お住まいの場所を入力してください"
              maxLength={30}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              {formData.location.length}/30文字
            </p>
          </div>

          {/* ウェブサイト */}
          <div className="space-y-2">
            <Label htmlFor="website_url" className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4" />
              <span>ウェブサイト</span>
            </Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://example.com"
              maxLength={255}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              あなたのウェブサイトやポートフォリオのURLを入力してください
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 成功メッセージ */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                プロフィールが正常に更新されました！
              </AlertDescription>
            </Alert>
          )}

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? '更新中...' : '保存'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}