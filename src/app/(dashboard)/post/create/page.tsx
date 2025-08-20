import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostCreateForm } from '@/components/posts/post-create-form'
import { createPost } from './actions'

export default async function CreatePostPage() {
  const supabase = await createClient()
  
  // 認証チェック
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">N</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            新規投稿
          </h1>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <PostCreateForm onSubmit={createPost} />
        </div>
      </div>
    </div>
  )
}