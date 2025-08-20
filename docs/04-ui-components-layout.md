# チケット #04: 基本UIコンポーネント・レイアウト実装

## 概要
アプリケーション全体で使用する基本UIコンポーネントとレイアウトシステムを実装。X（Twitter）ライクなデザインで独自性を持たせる。

## TODO
- [ ] shadcn/ui追加コンポーネントのインストール
- [ ] カスタムUIコンポーネント作成
- [ ] レスポンシブレイアウト実装
- [ ] ナビゲーションコンポーネント実装
- [ ] サイドバーコンポーネント実装
- [ ] ヘッダーコンポーネント実装
- [ ] ローディング・スケルトンコンポーネント実装
- [ ] エラー表示コンポーネント実装
- [ ] モーダル・ダイアログコンポーネント実装

## 詳細実装

### 1. 追加shadcn/uiコンポーネントのインストール
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add hover-card
npx shadcn-ui@latest add popover
```

### 2. レイアウト構成

#### components/layout/app-layout.tsx
```typescript
import { Header } from './header'
import { Sidebar } from './sidebar'
import { AuthProvider } from '@/components/auth/auth-provider'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* サイドバー */}
            <div className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-20">
                <Sidebar />
              </div>
            </div>
            
            {/* メインコンテンツ */}
            <main className="lg:col-span-6">
              {children}
            </main>
            
            {/* 右サイドバー（推奨フォローなど） */}
            <div className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-20">
                <div className="space-y-4">
                  {/* 追加コンテンツ用 */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
```

#### components/layout/header.tsx
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/components/auth/auth-provider'
import { Search, Bell, Plus, Settings, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'

export function Header() {
  const { user, profile, loading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* ロゴ */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="text-xl font-bold">SocialBlog</span>
        </Link>

        {/* 検索バー */}
        <div className="hidden flex-1 max-w-md mx-8 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="検索..."
              className="pl-10"
            />
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              {/* 新規投稿ボタン */}
              <Button size="sm" asChild>
                <Link href="/create">
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">投稿</span>
                </Link>
              </Button>

              {/* 通知ボタン */}
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              {/* ユーザーメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
                      <AvatarFallback>
                        {profile?.display_name?.charAt(0) || profile?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile?.display_name && (
                        <p className="font-medium">{profile.display_name}</p>
                      )}
                      {profile?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>プロフィール</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>設定</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">新規登録</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
```

#### components/layout/sidebar.tsx
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/components/auth/auth-provider'
import { Home, Search, Bell, Mail, Bookmark, User, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'ホーム', href: '/' },
  { icon: Search, label: '検索', href: '/search' },
  { icon: Bell, label: '通知', href: '/notifications' },
  { icon: Mail, label: 'メッセージ', href: '/messages' },
  { icon: Bookmark, label: 'ブックマーク', href: '/bookmarks' },
  { icon: User, label: 'プロフィール', href: '/profile' },
  { icon: Settings, label: '設定', href: '/settings' },
]

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  return (
    <Card>
      <CardContent className="p-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
```

### 3. カスタムUIコンポーネント

#### components/ui/loading-spinner.tsx
```typescript
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
```

#### components/ui/post-skeleton.tsx
```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PostSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### components/ui/empty-state.tsx
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

#### components/ui/error-boundary.tsx
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold">エラーが発生しました</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || '予期しないエラーが発生しました'}
        </p>
        <Button onClick={reset}>再試行</Button>
      </CardContent>
    </Card>
  )
}
```

### 4. レスポンシブ対応

#### globals.css 追加スタイル
```css
/* モバイル優先のレスポンシブ対応 */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* スクロールバーカスタマイズ */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--foreground));
}

/* フォーカス表示の改善 */
.focus\:ring-2:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
```

### 5. ルートレイアウト更新

#### app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SocialBlog - あなたの声を世界に",
    template: "%s | SocialBlog"
  },
  description: "Next.js 15で作られたソーシャルブログプラットフォーム",
  keywords: ["ブログ", "ソーシャル", "Next.js", "React"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
```

## 完了条件
- [ ] 全てのUIコンポーネントが正常にレンダリングされる
- [ ] レスポンシブデザインがモバイル・デスクトップで適切に表示される
- [ ] ナビゲーションが正常に機能する
- [ ] ローディング・エラー状態が適切に表示される
- [ ] 認証状態に応じてUIが変更される
- [ ] TypeScriptエラーがない
- [ ] アクセシビリティに配慮されている

## 関連チケット
- 前: #03 認証システム実装
- 次: #05 記事投稿・表示機能実装
- 依存: #03の完了が必要

## 注意事項
- モバイルファーストでデザイン
- shadcn/uiのデザインシステムを維持
- パフォーマンスを意識したコンポーネント設計
- 十分なコントラスト比を確保

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
UIコンポーネントは再利用性を重視し、一貫性のあるデザインシステムを構築する。