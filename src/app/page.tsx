import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PostTimeline } from '@/components/posts/post-timeline'
import { LandingPage } from '@/components/landing-page'
import { Suspense } from 'react'


export default async function Home() {
  const supabase = await createClient()
  
  // ユーザーの認証状態を確認
  const { data: { user }, error } = await supabase.auth.getUser()

  // 未ログインユーザーはランディングページを表示
  if (error || !user) {
    return <LandingPage />
  }

  // ログイン済みユーザーはタイムラインを表示
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              タイムライン
            </h1>
          </div>
          <Link href="/post/create">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>投稿する</span>
            </Button>
          </Link>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <PostTimeline />
        </Suspense>
      </div>
    </div>
  )
}
