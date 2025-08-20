import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditContainer } from '@/components/profile/profile-edit-container'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  
  // 認証チェック
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  // 現在のユーザーのプロフィールを取得
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // プロフィールが存在しない場合は作成
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: user.email?.split('@')[0] || user.id.slice(0, 8),
        display_name: user.user_metadata?.full_name || null,
        email: user.email
      })
      .select('*')
      .single()

    if (createError || !newProfile) {
      console.error('Failed to create profile:', createError)
      redirect('/dashboard')
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              プロフィール編集
            </h1>
          </div>
          <ProfileEditContainer profile={newProfile} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">N</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            プロフィール編集
          </h1>
        </div>
        <ProfileEditContainer profile={profile} />
      </div>
    </div>
  )
}