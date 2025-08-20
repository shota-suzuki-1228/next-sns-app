# チケット #07: 検索・カテゴリ・タグ機能実装

## 概要
全文検索機能、カテゴリ別表示、タグ機能、高度な検索フィルター機能を実装する。

## TODO
- [ ] 全文検索機能実装（タイトル・本文検索）
- [ ] カテゴリ別記事一覧実装
- [ ] タグ別記事一覧実装
- [ ] 高度な検索フィルター実装
- [ ] 検索結果ページ実装
- [ ] 検索履歴機能実装（ローカルストレージ）
- [ ] おすすめタグ・カテゴリ表示
- [ ] 検索API最適化
- [ ] 検索結果のページネーション

## 詳細実装

### 1. 検索コンポーネント

#### components/search/search-input.tsx
```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, Filter, X, History, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchInputProps {
  className?: string
  placeholder?: string
}

export function SearchInput({ className, placeholder = "検索..." }: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingTags, setTrendingTags] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  
  const debouncedQuery = useDebounce(query, 300)

  // 初期化時に検索履歴とトレンドタグを取得
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
    fetchTrendingTags()
    
    // URLパラメータから検索クエリを取得
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
    }
  }, [searchParams])

  // 検索候補を取得
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          excerpt,
          profiles (username, display_name)
        `)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setSuggestions(data || [])
    } catch (error) {
      console.error('Search suggestions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendingTags = async () => {
    try {
      const { data, error } = await supabase
        .from('post_tags')
        .select(`
          tag_id,
          tags (id, name)
        `)
        .limit(10)

      if (error) throw error
      
      // タグの使用頻度をカウント
      const tagCounts = data.reduce((acc: any, item: any) => {
        const tag = item.tags
        if (tag) {
          acc[tag.id] = { ...tag, count: (acc[tag.id]?.count || 0) + 1 }
        }
        return acc
      }, {})

      const sortedTags = Object.values(tagCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)

      setTrendingTags(sortedTags as any[])
    } catch (error) {
      console.error('Trending tags error:', error)
    }
  }

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return

    // 検索履歴に追加
    const newRecentSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5)
    
    setRecentSearches(newRecentSearches)
    localStorage.setItem('recent-searches', JSON.stringify(newRecentSearches))

    // 検索ページに遷移
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recent-searches')
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pl-10 pr-10"
              onFocus={() => setIsOpen(true)}
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="start">
          <div className="max-h-96 overflow-y-auto">
            {/* 検索候補 */}
            {query.length >= 2 && (
              <div className="border-b p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">検索候補</span>
                  {loading && <span className="text-xs text-muted-foreground">読み込み中...</span>}
                </div>
                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    {suggestions.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                      >
                        <div className="font-medium text-sm truncate">{post.title}</div>
                        <div className="text-xs text-muted-foreground">
                          by @{post.profiles.username}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : !loading && (
                  <p className="text-sm text-muted-foreground">候補が見つかりません</p>
                )}
                
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearch()}
                    className="w-full mt-2 justify-start"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    "{query}" で検索
                  </Button>
                )}
              </div>
            )}

            {/* 検索履歴 */}
            {recentSearches.length > 0 && (
              <div className="border-b p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">最近の検索</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-6 text-xs"
                  >
                    クリア
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left p-1 rounded hover:bg-muted transition-colors text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* トレンドタグ */}
            {trendingTags.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">トレンドタグ</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => router.push(`/tags/${tag.name}`)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

### 2. 検索結果ページ

#### app/search/page.tsx
```typescript
import { Suspense } from 'react'
import { SearchResults } from '@/components/search/search-results'
import { SearchFilters } from '@/components/search/search-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostSkeleton } from '@/components/ui/post-skeleton'

interface SearchPageProps {
  searchParams: {
    q?: string
    category?: string
    tag?: string
    author?: string
    sort?: 'recent' | 'likes' | 'comments'
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {query ? `"${query}"の検索結果` : '検索'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <SearchFilters searchParams={searchParams} />
            </div>
            <div className="lg:col-span-3">
              <Suspense fallback={<SearchSkeleton />}>
                <SearchResults searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
```

#### components/search/search-results.tsx
```typescript
import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/posts/post-card'
import { EmptyState } from '@/components/ui/empty-state'
import { SearchX } from 'lucide-react'

interface SearchResultsProps {
  searchParams: {
    q?: string
    category?: string
    tag?: string
    author?: string
    sort?: 'recent' | 'likes' | 'comments'
  }
}

export async function SearchResults({ searchParams }: SearchResultsProps) {
  const supabase = await createClient()
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url
      ),
      categories (
        name,
        color
      ),
      _count: (
        SELECT COUNT(*) as likes FROM likes WHERE post_id = posts.id
      ),
      _count: (
        SELECT COUNT(*) as comments FROM comments WHERE post_id = posts.id
      ),
      _count: (
        SELECT COUNT(*) as reposts FROM reposts WHERE post_id = posts.id
      )
    `)
    .eq('published', true)

  // 検索クエリでフィルタリング
  if (searchParams.q) {
    query = query.or(`title.ilike.%${searchParams.q}%,content.ilike.%${searchParams.q}%`)
  }

  // カテゴリでフィルタリング
  if (searchParams.category) {
    query = query.eq('categories.name', searchParams.category)
  }

  // 作者でフィルタリング
  if (searchParams.author) {
    query = query.eq('profiles.username', searchParams.author)
  }

  // タグでフィルタリング
  if (searchParams.tag) {
    const { data: tagPosts } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tags.name', searchParams.tag)
    
    if (tagPosts && tagPosts.length > 0) {
      const postIds = tagPosts.map(pt => pt.post_id)
      query = query.in('id', postIds)
    } else {
      // タグが見つからない場合は空の結果を返す
      return (
        <EmptyState
          icon={<SearchX className="h-12 w-12" />}
          title="検索結果が見つかりません"
          description="指定されたタグの記事が見つかりませんでした"
        />
      )
    }
  }

  // ソート
  switch (searchParams.sort) {
    case 'likes':
      // いいね数でソート（サブクエリが必要）
      query = query.order('created_at', { ascending: false })
      break
    case 'comments':
      // コメント数でソート（サブクエリが必要）
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: posts, error } = await query.limit(20)

  if (error) {
    console.error('Search error:', error)
    return (
      <EmptyState
        icon={<SearchX className="h-12 w-12" />}
        title="検索エラー"
        description="検索中にエラーが発生しました"
      />
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="h-12 w-12" />}
        title="検索結果が見つかりません"
        description={
          searchParams.q 
            ? `"${searchParams.q}"に関する記事が見つかりませんでした`
            : "条件に合う記事が見つかりませんでした"
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        {posts.length}件の記事が見つかりました
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

### 3. 検索フィルター

#### components/search/search-filters.tsx
```typescript
import { createClient } from '@/lib/supabase/server'
import { SearchFiltersClient } from './search-filters-client'

interface SearchFiltersProps {
  searchParams: {
    q?: string
    category?: string
    tag?: string
    author?: string
    sort?: 'recent' | 'likes' | 'comments'
  }
}

export async function SearchFilters({ searchParams }: SearchFiltersProps) {
  const supabase = await createClient()

  // カテゴリ一覧を取得
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // 人気タグを取得
  const { data: popularTags } = await supabase
    .from('tags')
    .select('*')
    .order('name')
    .limit(20)

  return (
    <SearchFiltersClient
      categories={categories || []}
      tags={popularTags || []}
      searchParams={searchParams}
    />
  )
}
```

#### components/search/search-filters-client.tsx
```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

interface SearchFiltersClientProps {
  categories: Array<{ id: string; name: string; color: string }>
  tags: Array<{ id: string; name: string }>
  searchParams: {
    q?: string
    category?: string
    tag?: string
    author?: string
    sort?: 'recent' | 'likes' | 'comments'
  }
}

export function SearchFiltersClient({
  categories,
  tags,
  searchParams
}: SearchFiltersClientProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  const updateFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`/search?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    if (searchParams.q) {
      params.set('q', searchParams.q)
    }
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = searchParams.category || searchParams.tag || searchParams.author || searchParams.sort

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">フィルター</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                クリア
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ソート */}
          <div>
            <label className="text-sm font-medium mb-2 block">並び順</label>
            <Select value={searchParams.sort || 'recent'} onValueChange={(value) => updateFilter('sort', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">最新順</SelectItem>
                <SelectItem value="likes">いいね順</SelectItem>
                <SelectItem value="comments">コメント順</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* カテゴリ */}
          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">カテゴリ</label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={searchParams.category === category.name ? "default" : "outline"}
                    className="cursor-pointer w-full justify-start"
                    style={{
                      backgroundColor: searchParams.category === category.name 
                        ? category.color 
                        : 'transparent',
                      borderColor: category.color
                    }}
                    onClick={() => 
                      updateFilter('category', 
                        searchParams.category === category.name ? undefined : category.name
                      )
                    }
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 人気タグ */}
          {tags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">人気タグ</label>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={searchParams.tag === tag.name ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => 
                      updateFilter('tag', 
                        searchParams.tag === tag.name ? undefined : tag.name
                      )
                    }
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <span className="text-sm font-medium">適用中のフィルター:</span>
              <div className="flex flex-wrap gap-2">
                {searchParams.category && (
                  <Badge variant="secondary">
                    カテゴリ: {searchParams.category}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('category')}
                    />
                  </Badge>
                )}
                {searchParams.tag && (
                  <Badge variant="secondary">
                    タグ: #{searchParams.tag}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('tag')}
                    />
                  </Badge>
                )}
                {searchParams.author && (
                  <Badge variant="secondary">
                    作者: @{searchParams.author}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('author')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### 4. カスタムフック

#### hooks/use-debounce.ts
```typescript
'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

## 完了条件
- [ ] 全文検索が正常に動作する
- [ ] カテゴリ・タグフィルターが正常に動作する
- [ ] 検索候補が適切に表示される
- [ ] 検索履歴が保存・表示される
- [ ] レスポンシブデザインが適切に動作する
- [ ] 検索パフォーマンスが適切である

## 関連チケット
- 前: #06 ソーシャル機能実装
- 次: #08 ユーザープロフィール機能実装
- 依存: #06の完了が必要

## 注意事項
- 検索クエリのサニタイゼーション
- SQLインジェクション対策
- 検索パフォーマンスの最適化
- 大量データでの検索負荷対策

## 進捗
- [ ] 開始前
- [ ] 進行中
- [ ] レビュー待ち  
- [ ] 完了

## メモ・備考
検索機能はユーザビリティの要。レスポンス速度とUIの使いやすさを重視。