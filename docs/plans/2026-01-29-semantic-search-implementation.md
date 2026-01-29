# Semantic Search Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a direct vector exploration interface at `/search` for discovering patterns and connections across research papers without LLM synthesis.

**Architecture:** Phase 1 builds core search with flat results list. Phase 2 adds UMAP clustering visualization. Phase 3 adds polish (grouped view, context expansion, advanced filters). Uses existing vector DB infrastructure, adds new Server Actions, and introduces UMAP for dimensionality reduction.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase (existing), OpenAI Embeddings (existing), umap-js (new)

---

## Phase 1: Core Search (MVP)

### Task 1: TypeScript Types

**Files:**
- Create: `app/search/types.ts`

**Step 1: Create types file**

```typescript
// app/search/types.ts
export type SearchMode = 'concept' // Future: 'similar-passage'

export type SearchOptions = {
  query: string
  mode: SearchMode
  limit: number // 5-50
  project?: string
  sourceFiles?: string[]
  minSimilarity: number // 0.5-1.0
}

export type SearchResult = {
  id: string
  content: string
  similarity: number
  embedding: number[] // For UMAP in Phase 2
  metadata: {
    document_title: string
    authors: string[]
    publication_year: number
    doi: string
    source_file: string
  }
}

export type SearchMetadata = {
  totalFound: number
  filteredByThreshold: number
  latencyMs: number
  estimatedCost: number
}

export type SearchResponse = {
  success: boolean
  results?: SearchResult[]
  metadata?: SearchMetadata
  error?: string
}
```

**Step 2: Commit**

```bash
git add app/search/types.ts
git commit -m "feat(search): add TypeScript types for semantic search"
```

---

### Task 2: Server Action - semanticSearch

**Files:**
- Create: `app/actions/semanticSearch.ts`
- Reference: `lib/vectordb/retriever.ts` (existing), `lib/vectordb/embeddings.ts` (existing)

**Step 1: Create server action file**

```typescript
// app/actions/semanticSearch.ts
'use server'

import { getEmbeddings } from '@/lib/vectordb/embeddings'
import { getSupabaseClient } from '@/lib/vectordb/supabase'
import { SearchOptions, SearchResponse, SearchResult } from '@/app/search/types'

/**
 * Server Action: Semantic search across document corpus
 *
 * Embeds query and retrieves similar passages by cosine similarity
 * without LLM synthesis (unlike /query which does RAG)
 *
 * @param options - Search configuration
 * @returns Search results with embeddings for visualization
 */
export async function semanticSearch(
  options: SearchOptions
): Promise<SearchResponse> {
  const startTime = performance.now()

  try {
    // Validate input
    if (!options.query || options.query.trim().length < 3) {
      return {
        success: false,
        error: 'Query must be at least 3 characters',
      }
    }

    // Step 1: Embed query
    const embeddingsModel = getEmbeddings()
    const queryEmbedding = await embeddingsModel.embedQuery(options.query)

    // Step 2: Retrieve similar documents
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      filter: {},
      match_count: options.limit,
      source_files: options.sourceFiles || null,
      project_filter: options.project || null,
    })

    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }

    if (!data) {
      return {
        success: true,
        results: [],
        metadata: {
          totalFound: 0,
          filteredByThreshold: 0,
          latencyMs: performance.now() - startTime,
          estimatedCost: 0,
        },
      }
    }

    // Step 3: Filter by similarity threshold and map to SearchResult
    const allResults: SearchResult[] = data.map((row: any) => ({
      id: row.id.toString(),
      content: row.content,
      similarity: row.similarity,
      embedding: [], // Embeddings not available from match_documents, will fetch separately in Phase 2
      metadata: {
        document_title: row.metadata?.document_title || 'Unknown',
        authors: row.metadata?.authors || [],
        publication_year: row.metadata?.publication_year || 0,
        doi: row.metadata?.doi || '',
        source_file: row.metadata?.source_file || 'unknown',
      },
    }))

    const filteredResults = allResults.filter(
      (r) => r.similarity >= options.minSimilarity
    )

    // Step 4: Calculate cost (embedding only: $0.02/1M tokens, ~8 tokens per query)
    const estimatedTokens = 8
    const estimatedCost = (estimatedTokens / 1_000_000) * 0.02

    const totalLatencyMs = performance.now() - startTime

    return {
      success: true,
      results: filteredResults,
      metadata: {
        totalFound: allResults.length,
        filteredByThreshold: allResults.length - filteredResults.length,
        latencyMs: totalLatencyMs,
        estimatedCost,
      },
    }
  } catch (error) {
    console.error('Error in semanticSearch:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
```

**Step 2: Test manually**

Since there's no test framework yet:
1. Run `pnpm dev`
2. Create a minimal test page to call this action
3. Verify it returns results

**Step 3: Commit**

```bash
git add app/actions/semanticSearch.ts
git commit -m "feat(search): add semanticSearch server action"
```

---

### Task 3: Search Input Component

**Files:**
- Create: `app/search/SearchInput.tsx`

**Step 1: Create search input component**

```typescript
// app/search/SearchInput.tsx
'use client'

import { useState } from 'react'
import { SearchMode } from './types'

type SearchInputProps = {
  onSearch: (query: string, options: {
    mode: SearchMode
    limit: number
    minSimilarity: number
  }) => void
  isSearching: boolean
}

export function SearchInput({ onSearch, isSearching }: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [mode] = useState<SearchMode>('concept')
  const [limit, setLimit] = useState(20)
  const [minSimilarity, setMinSimilarity] = useState(0.5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 3) {
      onSearch(query, { mode, limit, minSimilarity })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit}>
        {/* Search Mode Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Mode
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            value={mode}
            disabled
          >
            <option value="concept">Concept Search</option>
            <option disabled>Find Similar Passages (Coming Soon)</option>
          </select>
        </div>

        {/* Query Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter concept or phrase..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-lg"
            minLength={3}
            required
          />
          {query.length > 0 && query.length < 3 && (
            <p className="text-red-500 text-sm mt-1">
              Enter at least 3 characters
            </p>
          )}
        </div>

        {/* Basic Options (Advanced collapsible in Phase 3) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Results
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              min={5}
              max={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Similarity: {minSimilarity.toFixed(2)}
            </label>
            <input
              type="range"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
              min={0.5}
              max={1.0}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isSearching || query.trim().length < 3}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/search/SearchInput.tsx
git commit -m "feat(search): add SearchInput component"
```

---

### Task 4: Result Card Component

**Files:**
- Create: `app/search/ResultCard.tsx`

**Step 1: Create result card component**

```typescript
// app/search/ResultCard.tsx
'use client'

import { SearchResult } from './types'

type ResultCardProps = {
  result: SearchResult
  clusterColor?: string
}

export function ResultCard({ result, clusterColor }: ResultCardProps) {
  const similarityPercent = Math.round(result.similarity * 100)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      {/* Similarity Bar and Score */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${similarityPercent}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-700">
          {result.similarity.toFixed(2)}
        </span>
        {clusterColor && (
          <div
            className="w-4 h-4 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: clusterColor }}
            title="Cluster color"
          />
        )}
      </div>

      {/* Passage Text */}
      <p className="text-gray-800 mb-3 leading-relaxed">{result.content}</p>

      {/* Document Metadata */}
      <div className="border-t pt-3 text-sm text-gray-600">
        <p className="font-semibold text-gray-900 mb-1">
          From: {result.metadata.document_title}
        </p>
        <p>
          Authors: {result.metadata.authors.join(', ') || 'Unknown'}
        </p>
        <p className="flex items-center gap-2">
          Year: {result.metadata.publication_year || 'Unknown'}
          {result.metadata.doi && (
            <>
              <span>•</span>
              <a
                href={`https://doi.org/${result.metadata.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                DOI: {result.metadata.doi}
              </a>
            </>
          )}
        </p>
      </div>

      {/* Actions Placeholder (Phase 3) */}
      <div className="mt-3 flex gap-2">
        <button
          disabled
          className="text-sm text-gray-400 cursor-not-allowed"
        >
          Show Context (Coming Soon)
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/search/ResultCard.tsx
git commit -m "feat(search): add ResultCard component"
```

---

### Task 5: Results List Component

**Files:**
- Create: `app/search/ResultsList.tsx`

**Step 1: Create results list component**

```typescript
// app/search/ResultsList.tsx
'use client'

import { SearchResult } from './types'
import { ResultCard } from './ResultCard'

type ResultsListProps = {
  results: SearchResult[]
}

export function ResultsList({ results }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No results found. Try a different query or lower the similarity threshold.
      </div>
    )
  }

  return (
    <div>
      {/* Header with count (Grouped toggle in Phase 3) */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {results.length} {results.length === 1 ? 'Result' : 'Results'}
        </h2>
        {/* Flat/Grouped toggle placeholder for Phase 3 */}
      </div>

      {/* Flat Results List */}
      <div>
        {results.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/search/ResultsList.tsx
git commit -m "feat(search): add ResultsList component"
```

---

### Task 6: Search Page

**Files:**
- Create: `app/search/page.tsx`

**Step 1: Create search page**

```typescript
// app/search/page.tsx
'use client'

import { useState } from 'react'
import { SearchInput } from './SearchInput'
import { ResultsList } from './ResultsList'
import { semanticSearch } from '@/app/actions/semanticSearch'
import { SearchResult, SearchMetadata, SearchMode } from './types'

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (
    query: string,
    options: { mode: SearchMode; limit: number; minSimilarity: number }
  ) => {
    setIsSearching(true)
    setError(null)

    const response = await semanticSearch({
      query,
      mode: options.mode,
      limit: options.limit,
      minSimilarity: options.minSimilarity,
    })

    setIsSearching(false)

    if (response.success && response.results) {
      setResults(response.results)
      setMetadata(response.metadata || null)
    } else {
      setError(response.error || 'Search failed')
      setResults([])
      setMetadata(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Semantic Search</h1>
          <p className="text-xl text-purple-100">
            Explore concepts across your research corpus
          </p>
          <p className="mt-4 text-purple-50 max-w-3xl">
            This tool finds passages semantically similar to your query. Unlike
            the chat interface, you'll see raw passages ranked by
            similarity—no AI-generated answers. Use this to discover patterns,
            explore concepts, and find connections across papers.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Input */}
        <SearchInput onSearch={handleSearch} isSearching={isSearching} />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Metadata Display */}
        {metadata && (
          <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg mb-6 text-sm text-gray-700">
            Found {metadata.totalFound} passages in {metadata.latencyMs.toFixed(0)}ms
            {metadata.filteredByThreshold > 0 && (
              <> • Filtered {metadata.filteredByThreshold} below threshold</>
            )}
            {' • '}Cost: ${metadata.estimatedCost.toFixed(6)}
          </div>
        )}

        {/* Results (Visualization in Phase 2, Results List now) */}
        {!isSearching && results.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {/* Placeholder for visualization (Phase 2) */}
            <div className="col-span-1">
              <ResultsList results={results} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && !error && (
          <div className="text-center text-gray-500 py-12">
            Enter a search query to explore your research corpus
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Test the page**

Run: `pnpm dev`
Navigate to: `http://localhost:3000/search`
Expected: Page loads, can enter query, see results

**Step 3: Commit**

```bash
git add app/search/page.tsx
git commit -m "feat(search): add search page with basic functionality"
```

---

## Phase 2: UMAP Clustering Visualization

### Task 7: Add umap-js Dependency

**Files:**
- Modify: `package.json`

**Step 1: Install umap-js**

Run:
```bash
pnpm add umap-js
```

**Step 2: Verify installation**

Run: `pnpm list umap-js`
Expected: Shows umap-js version

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(search): add umap-js dependency for clustering"
```

---

### Task 8: UMAP Utility

**Files:**
- Create: `lib/search/umap.ts`

**Step 1: Create UMAP wrapper**

```typescript
// lib/search/umap.ts
import { UMAP } from 'umap-js'

export type Point2D = {
  x: number
  y: number
  id: string
}

/**
 * Reduce embeddings to 2D using UMAP
 *
 * @param embeddings - Array of high-dimensional embeddings
 * @param ids - Corresponding IDs for each embedding
 * @returns Array of 2D points with IDs
 */
export function reduceToUMAP(
  embeddings: number[][],
  ids: string[]
): Point2D[] {
  if (embeddings.length === 0) {
    return []
  }

  // Initialize UMAP
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors: Math.min(15, embeddings.length - 1),
    minDist: 0.1,
    spread: 1.0,
  })

  // Fit embeddings to 2D
  const coords2D = umap.fit(embeddings)

  // Map to Point2D format
  return coords2D.map((coord, idx) => ({
    x: coord[0],
    y: coord[1],
    id: ids[idx],
  }))
}
```

**Step 2: Commit**

```bash
git add lib/search/umap.ts
git commit -m "feat(search): add UMAP dimensionality reduction utility"
```

---

### Task 9: Simple K-Means Clustering

**Files:**
- Create: `lib/search/clustering.ts`

**Step 1: Create k-means implementation**

```typescript
// lib/search/clustering.ts
import { Point2D } from './umap'

export type Cluster = {
  id: number
  color: string
}

const CLUSTER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

/**
 * Simple k-means clustering for 2D points
 *
 * @param points - 2D points to cluster
 * @param k - Number of clusters (default: 5)
 * @returns Map of point ID to cluster assignment
 */
export function clusterPoints(
  points: Point2D[],
  k: number = 5
): Map<string, Cluster> {
  if (points.length === 0) {
    return new Map()
  }

  // Adjust k if we have fewer points
  const numClusters = Math.min(k, points.length)

  // Initialize centroids randomly
  const centroids: { x: number; y: number }[] = []
  for (let i = 0; i < numClusters; i++) {
    const idx = Math.floor(Math.random() * points.length)
    centroids.push({ x: points[idx].x, y: points[idx].y })
  }

  // Run k-means for 10 iterations
  const assignments = new Map<string, number>()

  for (let iter = 0; iter < 10; iter++) {
    // Assign points to nearest centroid
    assignments.clear()
    for (const point of points) {
      let minDist = Infinity
      let nearestCluster = 0

      for (let c = 0; c < centroids.length; c++) {
        const dist = Math.sqrt(
          Math.pow(point.x - centroids[c].x, 2) +
            Math.pow(point.y - centroids[c].y, 2)
        )
        if (dist < minDist) {
          minDist = dist
          nearestCluster = c
        }
      }

      assignments.set(point.id, nearestCluster)
    }

    // Update centroids
    const counts = new Array(numClusters).fill(0)
    const sums = centroids.map(() => ({ x: 0, y: 0 }))

    for (const point of points) {
      const cluster = assignments.get(point.id)!
      sums[cluster].x += point.x
      sums[cluster].y += point.y
      counts[cluster]++
    }

    for (let c = 0; c < numClusters; c++) {
      if (counts[c] > 0) {
        centroids[c].x = sums[c].x / counts[c]
        centroids[c].y = sums[c].y / counts[c]
      }
    }
  }

  // Map to Cluster objects with colors
  const clusterMap = new Map<string, Cluster>()
  for (const [id, clusterId] of assignments.entries()) {
    clusterMap.set(id, {
      id: clusterId,
      color: CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length],
    })
  }

  return clusterMap
}
```

**Step 2: Commit**

```bash
git add lib/search/clustering.ts
git commit -m "feat(search): add k-means clustering for visualization"
```

---

### Task 10: Get Embeddings from Database

**Files:**
- Create: `app/actions/getEmbeddings.ts`

**Step 1: Create getEmbeddings action**

```typescript
// app/actions/getEmbeddings.ts
'use server'

import { getSupabaseClient } from '@/lib/vectordb/supabase'

type EmbeddingResult = {
  id: string
  embedding: number[]
}

/**
 * Server Action: Fetch embeddings for specific document chunks
 *
 * Used for UMAP visualization after search results are returned
 *
 * @param ids - Array of chunk IDs
 * @returns Array of embeddings
 */
export async function getEmbeddings(
  ids: string[]
): Promise<{ success: boolean; embeddings?: EmbeddingResult[]; error?: string }> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('documents')
      .select('id, embedding')
      .in('id', ids.map((id) => parseInt(id)))

    if (error) {
      throw new Error(`Failed to fetch embeddings: ${error.message}`)
    }

    const embeddings: EmbeddingResult[] = (data || []).map((row: any) => ({
      id: row.id.toString(),
      embedding: row.embedding, // pgvector returns as array
    }))

    return { success: true, embeddings }
  } catch (error) {
    console.error('Error in getEmbeddings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

**Step 2: Commit**

```bash
git add app/actions/getEmbeddings.ts
git commit -m "feat(search): add getEmbeddings action for visualization"
```

---

### Task 11: Cluster Visualization Component

**Files:**
- Create: `app/search/ClusterVisualization.tsx`

**Step 1: Create visualization component using Canvas**

```typescript
// app/search/ClusterVisualization.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Point2D } from '@/lib/search/umap'
import { Cluster } from '@/lib/search/clustering'

type ClusterVisualizationProps = {
  points: Point2D[]
  clusters: Map<string, Cluster>
  onPointClick?: (id: string) => void
  selectedId?: string | null
}

export function ClusterVisualization({
  points,
  clusters,
  onPointClick,
  selectedId,
}: ClusterVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const dimensions = { width: 600, height: 600 }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || points.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Find bounds
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    // Add padding
    const padding = 40
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1)
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1)

    // Transform point to canvas coords
    const toCanvas = (p: Point2D) => ({
      x: padding + (p.x - minX) * scaleX,
      y: padding + (p.y - minY) * scaleY,
    })

    // Draw points
    points.forEach((point) => {
      const pos = toCanvas(point)
      const cluster = clusters.get(point.id)
      const isSelected = point.id === selectedId
      const isHovered = point.id === hoveredId

      // Determine styling
      const radius = isSelected ? 8 : isHovered ? 6 : 5
      const opacity = isSelected ? 1.0 : hoveredId && !isHovered ? 0.3 : 0.7

      // Draw point
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = cluster?.color || '#3b82f6'
      ctx.globalAlpha = opacity
      ctx.fill()

      // Draw border for selected
      if (isSelected) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.globalAlpha = 1.0
    })
  }, [points, clusters, selectedId, hoveredId])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Simplified for MVP - proper hit detection would be added later
    if (hoveredId && onPointClick) {
      onPointClick(hoveredId)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Semantic Clusters
      </h2>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleClick}
        className="border border-gray-200 rounded cursor-pointer"
      />
      <p className="text-sm text-gray-500 mt-2">
        Each dot represents a passage. Proximity indicates semantic similarity.
      </p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/search/ClusterVisualization.tsx
git commit -m "feat(search): add cluster visualization component"
```

---

### Task 12: Integrate Visualization into Search Page

**Files:**
- Modify: `app/search/page.tsx`
- Modify: `app/search/ResultsList.tsx`

**Step 1: Update page to include visualization**

In `app/search/page.tsx`, add imports at top:
```typescript
import { getEmbeddings } from '@/app/actions/getEmbeddings'
import { reduceToUMAP, Point2D } from '@/lib/search/umap'
import { clusterPoints, Cluster } from '@/lib/search/clustering'
import { ClusterVisualization } from './ClusterVisualization'
```

Add state:
```typescript
const [points, setPoints] = useState<Point2D[]>([])
const [clusters, setClusters] = useState<Map<string, Cluster>>(new Map())
const [selectedResultId, setSelectedResultId] = useState<string | null>(null)
```

Add visualization processing:
```typescript
const processVisualization = async (searchResults: SearchResult[]) => {
  const ids = searchResults.map((r) => r.id)
  const embeddingsResponse = await getEmbeddings(ids)

  if (!embeddingsResponse.success || !embeddingsResponse.embeddings) {
    console.warn('Failed to fetch embeddings for visualization')
    return
  }

  const embeddings = embeddingsResponse.embeddings.map((e) => e.embedding)
  const umapPoints = reduceToUMAP(embeddings, ids)
  setPoints(umapPoints)

  const clusterMap = clusterPoints(umapPoints, 5)
  setClusters(clusterMap)
}
```

Update handleSearch:
```typescript
if (response.success && response.results) {
  setResults(response.results)
  setMetadata(response.metadata || null)

  if (response.results.length > 0) {
    await processVisualization(response.results)
  }
} else {
  setError(response.error || 'Search failed')
  setResults([])
  setMetadata(null)
}
```

Replace results section:
```typescript
{!isSearching && results.length > 0 && (
  <div className="grid grid-cols-5 gap-6">
    <div className="col-span-2">
      <ClusterVisualization
        points={points}
        clusters={clusters}
        selectedId={selectedResultId}
        onPointClick={(id) => setSelectedResultId(id)}
      />
    </div>
    <div className="col-span-3">
      <ResultsList results={results} clusters={clusters} />
    </div>
  </div>
)}
```

**Step 2: Update ResultsList to accept clusters**

In `app/search/ResultsList.tsx`:

Update props:
```typescript
import { Cluster } from '@/lib/search/clustering'

type ResultsListProps = {
  results: SearchResult[]
  clusters?: Map<string, Cluster>
}

export function ResultsList({ results, clusters }: ResultsListProps) {
```

Pass cluster color:
```typescript
{results.map((result) => (
  <ResultCard
    key={result.id}
    result={result}
    clusterColor={clusters?.get(result.id)?.color}
  />
))}
```

**Step 3: Test visualization**

Run: `pnpm dev`
Search for: "agent orchestration"
Expected: See scatter plot on left, results on right

**Step 4: Commit**

```bash
git add app/search/page.tsx app/search/ResultsList.tsx
git commit -m "feat(search): integrate UMAP visualization with results"
```

---

## Phase 3: Polish & Advanced Features

### Task 13: Grouped View Toggle

**Files:**
- Modify: `app/search/ResultsList.tsx`

**Step 1: Add grouped view**

Add import and state:
```typescript
import { useState } from 'react'
import { Cluster } from '@/lib/search/clustering'
```

Add grouping logic (after component definition):
```typescript
const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat')

const groupedResults = results.reduce((acc, result) => {
  const doc = result.metadata.document_title
  if (!acc[doc]) {
    acc[doc] = []
  }
  acc[doc].push(result)
  return acc
}, {} as Record<string, SearchResult[]>)
```

Replace header section with toggle:
```typescript
<div className="mb-4 flex items-center justify-between">
  <h2 className="text-lg font-semibold text-gray-900">
    {results.length} {results.length === 1 ? 'Result' : 'Results'}
  </h2>

  <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
    <button
      onClick={() => setViewMode('flat')}
      className={`px-3 py-1 rounded ${
        viewMode === 'flat'
          ? 'bg-white shadow text-blue-600'
          : 'text-gray-600'
      }`}
    >
      Flat List
    </button>
    <button
      onClick={() => setViewMode('grouped')}
      className={`px-3 py-1 rounded ${
        viewMode === 'grouped'
          ? 'bg-white shadow text-blue-600'
          : 'text-gray-600'
      }`}
    >
      Grouped
    </button>
  </div>
</div>
```

Add grouped view rendering:
```typescript
{viewMode === 'flat' && (
  <div>
    {results.map((result) => (
      <ResultCard
        key={result.id}
        result={result}
        clusterColor={clusters?.get(result.id)?.color}
      />
    ))}
  </div>
)}

{viewMode === 'grouped' && (
  <div>
    {Object.entries(groupedResults)
      .sort((a, b) => b[1][0].similarity - a[1][0].similarity)
      .map(([docTitle, docResults]) => (
        <div key={docTitle} className="mb-6">
          <div className="bg-gray-100 px-4 py-2 rounded-t-lg font-semibold text-gray-900">
            {docTitle} ({docResults.length}{' '}
            {docResults.length === 1 ? 'passage' : 'passages'})
          </div>
          <div className="border-l-2 border-r-2 border-b-2 border-gray-200 rounded-b-lg p-2">
            {docResults.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                clusterColor={clusters?.get(result.id)?.color}
              />
            ))}
          </div>
        </div>
      ))}
  </div>
)}
```

**Step 2: Test grouped view**

Run: `pnpm dev`
Toggle views
Expected: Grouped view shows documents with passage counts

**Step 3: Commit**

```bash
git add app/search/ResultsList.tsx
git commit -m "feat(search): add grouped view toggle"
```

---

### Task 14: Show Context Feature

**Files:**
- Create: `app/actions/getChunkContext.ts`
- Modify: `app/search/ResultCard.tsx`

**Step 1: Create context action**

```typescript
// app/actions/getChunkContext.ts
'use server'

import { getSupabaseClient } from '@/lib/vectordb/supabase'

type ContextResponse = {
  success: boolean
  before?: string
  after?: string
  error?: string
}

export async function getChunkContext(
  chunkId: string
): Promise<ContextResponse> {
  try {
    const supabase = getSupabaseClient()
    const id = parseInt(chunkId)

    const { data, error } = await supabase
      .from('documents')
      .select('id, content, source_file')
      .gte('id', id - 1)
      .lte('id', id + 1)
      .order('id', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch context: ${error.message}`)
    }

    const currentChunk = data?.find((row: any) => row.id === id)
    const sourceFile = currentChunk?.source_file

    const beforeChunk = data?.find(
      (row: any) => row.id === id - 1 && row.source_file === sourceFile
    )
    const afterChunk = data?.find(
      (row: any) => row.id === id + 1 && row.source_file === sourceFile
    )

    return {
      success: true,
      before: beforeChunk?.content,
      after: afterChunk?.content,
    }
  } catch (error) {
    console.error('Error in getChunkContext:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

**Step 2: Update ResultCard**

In `app/search/ResultCard.tsx`, add imports:
```typescript
import { useState } from 'react'
import { getChunkContext } from '@/app/actions/getChunkContext'
```

Add state:
```typescript
const [showContext, setShowContext] = useState(false)
const [context, setContext] = useState<{ before?: string; after?: string }>({})
const [loadingContext, setLoadingContext] = useState(false)
```

Add handler:
```typescript
const handleShowContext = async () => {
  if (showContext) {
    setShowContext(false)
    return
  }

  setLoadingContext(true)
  const response = await getChunkContext(result.id)
  setLoadingContext(false)

  if (response.success) {
    setContext({ before: response.before, after: response.after })
    setShowContext(true)
  }
}
```

Replace actions section:
```typescript
<div className="mt-3 flex gap-2">
  <button
    onClick={handleShowContext}
    disabled={loadingContext}
    className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
  >
    {loadingContext ? 'Loading...' : showContext ? 'Hide Context' : 'Show Context'}
  </button>
</div>

{showContext && (
  <div className="mt-4 border-t pt-4">
    {context.before && (
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Chunk before:</p>
        <p className="text-gray-500 text-sm italic">{context.before}</p>
      </div>
    )}
    <div className="mb-3">
      <p className="text-xs text-gray-500 mb-1">Current chunk (highlighted):</p>
      <p className="bg-yellow-50 p-2 rounded text-sm">{result.content}</p>
    </div>
    {context.after && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Chunk after:</p>
        <p className="text-gray-500 text-sm italic">{context.after}</p>
      </div>
    )}
    {!context.before && !context.after && (
      <p className="text-sm text-gray-500">No surrounding context available</p>
    )}
  </div>
)}
```

**Step 3: Test**

Click "Show Context"
Expected: See before/after chunks

**Step 4: Commit**

```bash
git add app/actions/getChunkContext.ts app/search/ResultCard.tsx
git commit -m "feat(search): add context expansion"
```

---

### Task 15: Advanced Filters

**Files:**
- Modify: `app/search/SearchInput.tsx`
- Modify: `app/search/page.tsx`

**Step 1: Update SearchInput**

Add imports:
```typescript
import { useEffect } from 'react'
import { getProjects } from '@/app/actions/getDocuments'
```

Add state:
```typescript
const [showAdvanced, setShowAdvanced] = useState(false)
const [projects, setProjects] = useState<string[]>([])
const [selectedProject, setSelectedProject] = useState<string | undefined>()
```

Load projects:
```typescript
useEffect(() => {
  async function loadProjects() {
    const response = await getProjects()
    if (response.success && response.projects) {
      setProjects(response.projects)
    }
  }
  loadProjects()
}, [])
```

Update onSearch callback signature:
```typescript
onSearch(query, { mode, limit, minSimilarity, project: selectedProject })
```

Add advanced options after basic options:
```typescript
<button
  type="button"
  onClick={() => setShowAdvanced(!showAdvanced)}
  className="text-sm text-blue-600 hover:underline mb-2"
>
  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
</button>

{showAdvanced && (
  <div className="border-t pt-4 mb-4">
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Project Filter
      </label>
      <select
        value={selectedProject || ''}
        onChange={(e) => setSelectedProject(e.target.value || undefined)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All Projects</option>
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>
    </div>
  </div>
)}
```

**Step 2: Update page**

In `app/search/page.tsx`, update handleSearch:
```typescript
const handleSearch = async (
  query: string,
  options: {
    mode: SearchMode
    limit: number
    minSimilarity: number
    project?: string
  }
) => {
  setIsSearching(true)
  setError(null)

  const response = await semanticSearch({
    query,
    mode: options.mode,
    limit: options.limit,
    minSimilarity: options.minSimilarity,
    project: options.project,
  })

  // ... rest unchanged
}
```

**Step 3: Test**

Select project filter
Expected: Only results from that project

**Step 4: Commit**

```bash
git add app/search/SearchInput.tsx app/search/page.tsx
git commit -m "feat(search): add advanced filters with project selection"
```

---

### Task 16: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update documentation**

Add to "What's Done":
```markdown
- ✅ **Semantic search interface** - Direct vector exploration at /search
- ✅ **UMAP clustering visualization** - 2D scatter plot showing semantic relationships
- ✅ **Dual view layout** - Visualization (40%) + results list (60%)
- ✅ **Flat and grouped views** - Toggle between passage list and document grouping
- ✅ **Context expansion** - View surrounding chunks for deeper understanding
- ✅ **Advanced filters** - Project and similarity threshold filtering
```

Add new section after "Document Library":
```markdown
### Semantic Search
Direct vector exploration interface at /search:

**Purpose:**
- Explore concepts without LLM synthesis
- Discover patterns and connections across papers
- Identify which papers discuss specific topics

**Features:**
- **Concept Search**: Enter concept/phrase, get ranked passages by similarity
- **UMAP Visualization**: 2D scatter plot showing semantic clusters
- **Dual View**: Visualization (40%) + results list (60%) side-by-side
- **View Modes**:
  - Flat: All passages ranked by similarity
  - Grouped: Passages organized by document
- **Context Expansion**: Click "Show Context" to see surrounding chunks
- **Advanced Filters**:
  - Number of results (5-50, default 20)
  - Minimum similarity threshold (0.5-1.0, default 0.5)
  - Project filter
- **Instrumentation**: Tracks latency, cost, filtering stats

**Key Differences from Chat (/query):**
- No question reformulation or answer generation
- Raw passages with similarity scores
- Lower cost (embedding only, no LLM tokens)
- Better for exploratory research vs. Q&A
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with semantic search feature"
```

---

## Success Criteria

- [ ] Can search for concepts at `/search`
- [ ] See ranked passages with similarity scores
- [ ] UMAP visualization shows semantic clusters
- [ ] Can toggle between flat and grouped views
- [ ] Can expand results to see context
- [ ] Project filter works
- [ ] Similarity threshold filter works
- [ ] Instrumentation shows latency and cost
- [ ] No console errors
- [ ] All commits follow conventional commits format
- [ ] CLAUDE.md updated with new feature

---

## Notes

- This is a research/learning project - prioritize clarity over optimization
- Instrument everything for transparency (latency, cost, token usage)
- UMAP computation happens client-side (acceptable for 20-50 results)
- Future: Add "Find Similar Passages" mode, export features, annotations
- Pattern: Reuse existing vector DB infrastructure, add new UI layer
