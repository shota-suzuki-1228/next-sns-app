# チケット #09: デプロイ・本番環境構築

## 概要
Vercelへのデプロイ設定、本番環境用の最適化、監視・ログ設定、セキュリティ強化を行う。

## TODO
- [ ] Vercelプロジェクト作成・設定
- [ ] 環境変数設定（本番・ステージング）
- [ ] ビルド最適化設定
- [ ] ドメイン設定・DNS設定
- [ ] SSL証明書設定
- [ ] 本番用データベース設定確認
- [ ] パフォーマンス監視設定
- [ ] ログ・エラー監視設定
- [ ] セキュリティヘッダー設定
- [ ] 本番テスト・動作確認

## 詳細実装

### 1. Next.js設定最適化

#### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境での最適化
  compress: true,
  
  // 画像最適化
  images: {
    domains: [
      'avatars.githubusercontent.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('//', '') || '',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 実験的機能
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
```

### 2. Vercel設定

#### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "regions": ["nrt1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
      "NEXT_PUBLIC_APP_URL": "@app-url"
    }
  }
}
```

### 3. 環境別設定

#### lib/config.ts
```typescript
const config = {
  app: {
    name: 'SocialBlog',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  features: {
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableErrorReporting: process.env.NODE_ENV === 'production',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxImageSize: 2 * 1024 * 1024, // 2MB
  },
} as const

// 必須環境変数チェック
if (!config.supabase.url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!config.supabase.anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

export default config
```

### 4. エラー監視・ログ設定

#### lib/logger.ts
```typescript
interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

const LOG_LEVEL: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: keyof LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    }

    if (this.isDevelopment) {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data || '')
    } else {
      // 本番環境では構造化ログ
      console.log(JSON.stringify(logData))
    }

    // 本番環境でのエラー監視サービスへの送信
    if (level === 'error' && !this.isDevelopment) {
      this.sendToErrorService(logData)
    }
  }

  private async sendToErrorService(logData: any) {
    // TODO: Sentry、LogRocket、Datadogなどのエラー監視サービスに送信
    try {
      // 例: fetch('/api/errors', { method: 'POST', body: JSON.stringify(logData) })
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error)
    }
  }

  error(message: string, data?: any) {
    this.log('ERROR', message, data)
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data)
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data)
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('DEBUG', message, data)
    }
  }
}

export const logger = new Logger()
```

#### app/global-error.tsx
```typescript
'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // グローバルエラーをログに記録
    logger.error('Global error occurred', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
            <p className="text-muted-foreground mb-4">
              予期しないエラーが発生しました。しばらくしてからもう一度お試しください。
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

### 5. パフォーマンス最適化

#### lib/performance.ts
```typescript
// Web Vitals監視
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Google AnalyticsやDatadogに送信
    console.log('Web Vital:', metric)
    
    // 例: Google Analytics 4 への送信
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      })
    }
  }
}

// パフォーマンス計測用ユーティリティ
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map()

  static start(name: string) {
    this.marks.set(name, performance.now())
  }

  static end(name: string): number {
    const start = this.marks.get(name)
    if (!start) {
      console.warn(`Performance mark "${name}" not found`)
      return 0
    }

    const duration = performance.now() - start
    this.marks.delete(name)

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }
}
```

#### app/layout.tsx（Web Vitals追加）
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
import { Toaster } from "@/components/ui/toaster";
import { WebVitals } from "@/components/web-vitals";

// ... existing code ...

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
        <WebVitals />
      </body>
    </html>
  );
}
```

#### components/web-vitals.tsx
```typescript
'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/performance'

export function WebVitals() {
  useEffect(() => {
    // Web Vitalsの監視を開始
    import('web-vitals').then(({ onCLS, onFCP, onFID, onLCP, onTTFB }) => {
      onCLS(reportWebVitals)
      onFCP(reportWebVitals)
      onFID(reportWebVitals)
      onLCP(reportWebVitals)
      onTTFB(reportWebVitals)
    })
  }, [])

  return null
}
```

### 6. データベース最適化確認

#### database-optimization.sql
```sql
-- インデックスの確認と最適化

-- 投稿検索用のインデックス（全文検索）
CREATE INDEX IF NOT EXISTS idx_posts_search 
ON posts USING gin(to_tsvector('japanese', title || ' ' || content));

-- ユーザー関連のインデックス
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- パフォーマンス統計の有効化
SELECT pg_stat_statements_reset();

-- 使用頻度の高いクエリの最適化確認
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, pr.username, pr.display_name, pr.avatar_url,
       c.name as category_name, c.color as category_color
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.published = true
ORDER BY p.created_at DESC
LIMIT 20;
```

### 7. セキュリティ設定

#### lib/security.ts
```typescript
import { headers } from 'next/headers'
import { logger } from './logger'

// レート制限（簡易版）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<boolean> {
  const now = Date.now()
  const current = rateLimitMap.get(identifier)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (current.count >= limit) {
    logger.warn('Rate limit exceeded', { identifier, count: current.count })
    return false
  }

  current.count++
  return true
}

// CSRFトークン検証（簡易版）
export async function verifyCSRF(): Promise<boolean> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const referer = headersList.get('referer')
  const host = headersList.get('host')

  // 本番環境でのOrigin検証
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      `https://${host}`,
    ]

    if (origin && !allowedOrigins.includes(origin)) {
      logger.warn('Invalid origin detected', { origin, allowedOrigins })
      return false
    }
  }

  return true
}

// 入力値サニタイゼーション
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"']/g, '') // 危険な文字を除去
    .trim()
    .substring(0, 1000) // 最大長制限
}
```

### 8. 本番環境チェックリスト

#### scripts/production-check.js
```javascript
#!/usr/bin/env node

const checks = [
  {
    name: 'Environment Variables',
    check: () => {
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_APP_URL'
      ]
      
      const missing = required.filter(env => !process.env[env])
      
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`)
      }
      
      return '✅ All required environment variables are set'
    }
  },
  {
    name: 'Database Connection',
    check: async () => {
      // Supabase接続チェック
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`)
      }
      
      return '✅ Database connection successful'
    }
  },
  {
    name: 'Build Output',
    check: () => {
      const fs = require('fs')
      const path = require('path')
      
      const buildDir = path.join(process.cwd(), '.next')
      
      if (!fs.existsSync(buildDir)) {
        throw new Error('Build output not found. Run "npm run build" first.')
      }
      
      return '✅ Build output exists'
    }
  }
]

async function runChecks() {
  console.log('🔍 Running production checks...\n')
  
  let passed = 0
  let failed = 0
  
  for (const check of checks) {
    try {
      const result = await check.check()
      console.log(`${check.name}: ${result}`)
      passed++
    } catch (error) {
      console.error(`${check.name}: ❌ ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('🚀 Ready for production!')
  }
}

runChecks().catch(console.error)
```

### 9. デプロイスクリプト

#### package.json（scripts追加）
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "production-check": "node scripts/production-check.js",
    "deploy": "npm run type-check && npm run lint && npm run build && npm run production-check"
  }
}
```

### 10. 監視・アラート設定

#### lib/monitoring.ts
```typescript
// アプリケーション監視用のメトリクス
export class AppMetrics {
  static async recordUserAction(action: string, userId?: string) {
    if (process.env.NODE_ENV === 'production') {
      // メトリクス収集サービスに送信
      console.log('User action:', { action, userId, timestamp: new Date().toISOString() })
    }
  }

  static async recordError(error: Error, context?: any) {
    if (process.env.NODE_ENV === 'production') {
      // エラー監視サービスに送信
      console.error('Application error:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      })
    }
  }

  static async recordPerformance(metric: string, value: number) {
    if (process.env.NODE_ENV === 'production') {
      // パフォーマンス監視サービスに送信
      console.log('Performance metric:', { metric, value, timestamp: new Date().toISOString() })
    }
  }
}
```

## 完了条件
- [ ] Vercelへのデプロイが成功する
- [ ] 本番環境で全機能が正常に動作する
- [ ] SSL証明書が正しく設定されている
- [ ] 環境変数が適切に設定されている
- [ ] パフォーマンス監視が動作している
- [ ] エラー監視が動作している
- [ ] セキュリティヘッダーが設定されている
- [ ] データベースのパフォーマンスが最適化されている

## 関連チケット
- 前: #08 ユーザープロフィール機能実装
- 次: なし（最終チケット）
- 依存: #08の完了が必要

## 注意事項
- 本番データのバックアップ設定
- 環境変数の安全な管理
- 定期的なセキュリティアップデート
- 監視アラートの適切な設定

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
本番環境は慎重に構築し、継続的な監視とメンテナンスが重要。
セキュリティとパフォーマンスのバランスを考慮した設定を行う。