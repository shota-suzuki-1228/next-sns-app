'use client'

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border rounded-lg p-6">
          <div className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// クライアント側でのタイムライン表示
function TimelineDisplay({ activeTab }: { activeTab: 'all' | 'following' }) {
  if (activeTab === 'all') {
    // 全体タイムライン用のクライアント表示
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">全体のタイムラインは開発中です。</p>
          <p className="text-sm text-gray-500 mt-2">
            現在は認証後のサーバーサイドレンダリングで表示されます。
          </p>
        </div>
      </div>
    )
  } else {
    // フォロー中タイムライン用のクライアント表示
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">フォロー中のタイムラインは開発中です。</p>
          <p className="text-sm text-gray-500 mt-2">
            現在は認証後のサーバーサイドレンダリングで表示されます。
          </p>
        </div>
      </div>
    )
  }
}

export function TimelineTabsClient() {
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all')
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            className={`flex-1 rounded-none border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-transparent hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('all')}
          >
            すべての投稿
          </Button>
          {user && (
            <Button
              variant={activeTab === 'following' ? 'default' : 'ghost'}
              className={`flex-1 rounded-none border-b-2 transition-colors ${
                activeTab === 'following' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('following')}
            >
              フォロー中
            </Button>
          )}
        </div>
      </div>

      {/* タイムライン表示 */}
      <Suspense fallback={<TimelineSkeleton />}>
        <TimelineDisplay activeTab={activeTab} />
      </Suspense>
    </div>
  )
}