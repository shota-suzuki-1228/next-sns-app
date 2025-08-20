import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center px-4">
        {/* ロゴ */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mr-4">
            <span className="text-white font-bold text-3xl">N</span>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Next SNS App
          </h1>
        </div>
        
        {/* キャッチコピー */}
        <p className="text-2xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
          あなたの思いを投稿し、コミュニティと繋がり、素晴らしいコンテンツを発見しましょう。
        </p>
        
        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
              新規登録
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
              ログイン
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}