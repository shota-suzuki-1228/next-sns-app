# チケット #01: プロジェクト初期化・基盤構築

## 概要
Next.js 15ベースのソーシャルブログプラットフォームプロジェクトの初期化と基盤構築を行う。

## TODO
- [ ] Next.js 15プロジェクト作成（App Router使用）
- [ ] TypeScript設定
- [ ] Tailwind CSS + shadcn/ui設定
- [ ] 必要なパッケージインストール
- [ ] 環境変数設定ファイル作成（.env.local.example）
- [ ] プロジェクト構造の初期ディレクトリ作成
- [ ] 基本設定ファイル（next.config.ts、tailwind.config.js）
- [ ] ESLint、Prettier設定
- [ ] package.jsonスクリプト最適化

## 詳細仕様

### 技術構成
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UIライブラリ**: shadcn/ui
- **フォーム**: React Hook Form + Zod
- **状態管理**: React Context API
- **パッケージマネージャー**: npm

### 必要なパッケージ

#### フロントエンド関連
```bash
npm install @hookform/resolvers react-hook-form zod
npm install @radix-ui/react-avatar @radix-ui/react-button @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-input @radix-ui/react-label
npm install @radix-ui/react-textarea @radix-ui/react-toast @radix-ui/react-tooltip
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

#### Markdown関連
```bash
npm install react-markdown remark-gfm rehype-highlight
npm install @tailwindcss/typography
```

#### Supabase関連（次のチケットで使用）
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### プロジェクト構造
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui基本コンポーネント
│   ├── features/              # 機能別コンポーネント
│   └── layout/                # レイアウトコンポーネント
├── lib/
│   ├── utils.ts
│   └── validations.ts
├── hooks/                     # カスタムフック
├── types/                     # TypeScript型定義
├── context/                   # React Context
└── constants/                 # 定数定義
```

### shadcn/ui初期設定
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea avatar dropdown-menu dialog toast
```

### 環境変数テンプレート (.env.local.example)
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Tailwind設定 (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
```

### TypeScript設定の確認ポイント
- パスエイリアス `@/*` の設定確認
- strict モードの有効化
- Next.js App Router用プラグイン設定

## 完了条件
- [ ] `npm run dev` でローカル開発サーバーが起動する
- [ ] `npm run build` でビルドが成功する
- [ ] `npm run lint` でESLintチェックが通る
- [ ] shadcn/ui コンポーネントが正常にimportできる
- [ ] TypeScriptエラーがない
- [ ] 基本的なディレクトリ構造が作成されている

## 関連チケット
- 次: #02 Supabase設定・データベース構築
- 依存: なし

## 注意事項
- Turbopack は開発時のみ使用（`npm run dev`）
- App Router構成に従い、`src/app/` 配下はルーティング専用
- ビジネスロジックは `src/components/` や `src/lib/` に配置

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
このチケット完了後、基本的なNext.js 15アプリケーションとして動作する状態になる。