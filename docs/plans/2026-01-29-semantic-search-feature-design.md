# Semantic Search Feature Design

**Date:** January 29, 2026
**Status:** Design Complete
**Route:** `/search`

## Overview

The semantic search feature provides direct vector exploration of the research corpus. Unlike the chat interface at `/query` (which answers questions using RAG), this tool lets users explore concepts and discover patterns across papers without LLM synthesis.

### Key Differentiators from Chat Interface

| Aspect | Chat (`/query`) | Semantic Search (`/search`) |
|--------|----------------|---------------------------|
| **Input** | Natural language question | Concept/phrase/passage |
| **Processing** | Question reformulation + RAG + LLM synthesis | Pure vector similarity search |
| **Output** | AI-generated answer | Ranked passages with metadata |
| **Use Case** | "What does the literature say about X?" | "Show me everywhere X appears and how" |
| **Cost** | Higher (embedding + LLM tokens) | Lower (embedding only) |
| **Purpose** | Q&A with synthesis | Exploratory research |

## User Flow

1. Navigate to `/search` - User sees clear instructions explaining this is concept exploration, not chat
2. Enter search query - Type a concept/phrase (e.g., "agent orchestration")
3. Select search mode - Dropdown shows "Concept Search" (default), with placeholder for future modes
4. Configure filters (optional) - Collapsible "Advanced Options" for results count, document/project selection, similarity threshold
5. Execute search - System embeds query, retrieves top N chunks by cosine similarity
6. View dual layout:
   - **Left (40%)**: UMAP scatter plot showing semantic clusters
   - **Right (60%)**: Results list (flat by default, toggle to group by document)
7. Explore interactively - Hover/click visualization points, expand results to see context
8. Iterate - Refine query, adjust filters, switch views

## Page Layout & Components

### Header Section

- **Title**: "Semantic Search" with tagline "Explore concepts across your research corpus"
- **Instructions** (2-3 sentences):
  "This tool finds passages semantically similar to your query. Unlike the chat interface, you'll see raw passages ranked by similarity—no AI-generated answers. Use this to discover patterns, explore concepts, and find connections across papers."
- Visual distinction from `/query` (different accent color/icon)

### Search Input Section

```
┌─────────────────────────────────────────────────┐
│ Search Mode: [Concept Search ▼]                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Enter concept or phrase...                  │ │
│ └─────────────────────────────────────────────┘ │
│ [Advanced Options ▼]                     [Search]│
│   - Number of results: [20]                     │
│   - Project filter: [All Projects ▼]            │
│   - Document selection: [All / Select specific] │
│   - Min similarity: [0.5 ────●──── 1.0]         │
└─────────────────────────────────────────────────┘
```

**Search Mode Selector:**
- Initial: "Concept Search" (only active option)
- Grayed-out placeholder: "Find Similar Passages (Coming Soon)"
- Sets expectations for future extensibility

**Advanced Options (Collapsible):**
- **Number of Results**: Default 20, range 5-50
- **Project Filter**: Dropdown to filter by project (e.g., "AI System Design")
- **Document Selection**: Toggle "All" vs. "Select specific documents"
- **Min Similarity Threshold**: Slider 0.5-1.0 (default 0.5), filters out weakly related passages

### Results Section (Split Layout)

```
┌──────────────────┬────────────────────────────┐
│  Visualization   │   Results List             │
│  (40% width)     │   (60% width)              │
│                  │                            │
│  UMAP scatter    │  [Flat List ● Grouped]    │
│  plot showing    │  ─────────────────────     │
│  semantic        │  Result 1: [score] [...]   │
│  clusters        │  Result 2: [score] [...]   │
│                  │  Result 3: [score] [...]   │
└──────────────────┴────────────────────────────┘
```

## Component Architecture

### File Structure

```
app/search/
├── page.tsx                      # Main page component
├── SearchInput.tsx               # Search form + filters
├── ClusterVisualization.tsx      # UMAP scatter plot
├── ResultsList.tsx               # Results display with toggle
├── ResultCard.tsx                # Individual result component
└── types.ts                      # TypeScript types

lib/search/
├── umap.ts                       # UMAP wrapper (uses umap-js)
└── clustering.ts                 # K-means for cluster colors

app/actions/
└── semanticSearch.ts             # Server action
└── getChunkContext.ts            # Fetch surrounding chunks
```

### Component Hierarchy

- `app/search/page.tsx` - Main page
  - `SearchInput.tsx` - Search form with mode selector and filters
  - Split layout container:
    - `ClusterVisualization.tsx` - Left panel (40%)
    - `ResultsList.tsx` - Right panel (60%)
      - `ResultCard.tsx` - Individual passages

## Results Display

### Result Card (Individual Passage)

```
┌──────────────────────────────────────────────────┐
│ ████████████░░░░ 0.87                    [●]    │ ← Similarity bar + score + cluster dot
│                                                  │
│ "Multi-agent systems require careful            │
│ orchestration to prevent conflicts. We propose   │ ← Full passage text
│ a coordination protocol that..."                │
│                                                  │
│ From: "ACE: A Security Architecture for LLM..."  │ ← Document title (clickable)
│ Authors: Evan Li, Tushin Mallick, et al.         │ ← Authors
│ Year: 2026  DOI: arxiv.org/pdf/2504.20984       │ ← Year + DOI link
│                                                  │
│ [Show Context ▼]  [Find Similar to This]        │ ← Actions
└──────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Similarity bar**: Horizontal bar filled proportionally (0.87 = 87% filled)
- **Color dot**: Matches cluster color from visualization
- **Passage text**: Full chunk content, readable font
- **Metadata**: Document title (clickable), authors, year, DOI link
- **Actions**: "Show Context" button, "Find Similar" placeholder for future

### Show Context Feature

When user clicks "Show Context":

```
┌──────────────────────────────────────────────────┐
│ Chunk before (dimmed):                           │
│ "...previous paragraph discussing related work"  │
│                                                  │
│ Current chunk (highlighted):                     │
│ "Multi-agent systems require careful..."        │
│                                                  │
│ Chunk after (dimmed):                            │
│ "...next paragraph with implementation details"  │
│                                                  │
│ [Hide Context ▲]                                 │
└──────────────────────────────────────────────────┘
```

- Fetches surrounding chunks via `getChunkContext(chunkId)` server action
- Dimmed text for before/after, highlighted for current chunk
- Handles edge cases (first/last chunks in document)

### Flat vs. Grouped View Toggle

**Flat View (Default):**
- All results in one list, sorted by similarity (highest first)
- Best for seeing most relevant passages regardless of source

**Grouped View:**

```
┌──────────────────────────────────────────────────┐
│ ACE: A Security Architecture... (5 passages) ▼   │
│   ████████████░░░░ 0.87 "Multi-agent systems..." │
│   ███████████░░░░░ 0.82 "Coordination protocols"│
│   [3 more passages ▼]                            │
│                                                  │
│ LLM Applications: Current Paradigms... (3) ▼     │
│   ████████████░░░░ 0.79 "Orchestration patterns"│
│   [2 more passages ▼]                            │
└──────────────────────────────────────────────────┘
```

- Groups sorted by best match within each document
- Expandable document sections
- Answers: "Which papers discuss this concept most?"

## Clustering Visualization

### UMAP Scatter Plot Design

**Visual Appearance:**
- Each dot represents one passage result
- Spatial proximity = semantic similarity
- 2D reduction via UMAP from 1536-dimensional embeddings

**Point Styling:**
- **Size**: 8-10px diameter (consistent)
- **Color**: Cluster-based (5-7 color palette)
  - Assign via k-means or DBSCAN on 2D coordinates
  - Helps visually separate sub-topics
- **Opacity**: 0.7 default, 1.0 on hover, 0.3 for non-selected
- **Border**: Thick border on clicked point

### Interactions

**Hover over point:**
- Tooltip: similarity score + first 50 chars + document title
- Increase opacity to 1.0
- Optional: Highlight corresponding result card

**Click point:**
- Scroll to result in right panel
- Highlight result card (blue border)
- Dim other points to 0.3 opacity
- Click background to deselect

**Hover over result card:**
- Corresponding visualization point pulses/highlights
- Creates tight coupling between views

### UMAP Implementation

**Client-side processing:**

```typescript
// After receiving results from server
const umap = new UMAP({ nComponents: 2, nNeighbors: 15 })
const coords2D = umap.fit(embeddings) // [[x,y], [x,y], ...]

// Assign cluster colors via k-means
const clusters = kMeans(coords2D, k=5)

// Render scatter plot
renderVisualization(coords2D, clusters, results)
```

**Performance:**
- UMAP on 20-50 points: < 1 second
- Show "Generating visualization..." spinner during computation
- Acceptable for real-time use

**Fallback for many results:**
- If user requests 50+ results, show warning
- Option: "Show top 30 in visualization" while list shows all
- Prevents slow/cluttered viz

### Rendering

- **Option 1**: HTML5 Canvas (better performance for many points)
- **Option 2**: SVG with React library (`recharts`, `visx`)
- **Recommendation**: Start with Canvas for simplicity and performance

## Technical Architecture

### Server Action: `semanticSearch()`

**Input Type:**

```typescript
type SearchOptions = {
  query: string
  mode: 'concept' // Future: 'similar-passage'
  limit: number // 5-50
  project?: string
  sourceFiles?: string[] // Selected documents
  minSimilarity: number // 0.5-1.0
}
```

**Process:**
1. Validate input (query min 3 chars)
2. Embed query using OpenAI embeddings
3. Call `match_documents` RPC with embedding and filters
4. Filter results by `minSimilarity` threshold
5. Return results WITH embeddings (needed for UMAP)

**Output Type:**

```typescript
type SearchResult = {
  id: string
  content: string
  similarity: number
  embedding: number[] // Include for client-side UMAP
  metadata: {
    document_title: string
    authors: string[]
    publication_year: number
    doi: string
    source_file: string
  }
}

type SearchResponse = {
  success: boolean
  results: SearchResult[]
  metadata: {
    totalFound: number
    filteredByThreshold: number
    latencyMs: number
    estimatedCost: number
  }
  error?: string
}
```

### Server Action: `getChunkContext()`

**Purpose:** Fetch surrounding chunks when user clicks "Show Context"

**Input:**
```typescript
type ContextRequest = {
  chunkId: string
}
```

**Process:**
1. Find chunk by ID
2. Fetch previous and next chunks (by sequential ID or document order)
3. Handle edge cases (first/last chunks)

**Output:**
```typescript
type ContextResponse = {
  success: boolean
  before?: string
  after?: string
  error?: string
}
```

### Database

**Reuse existing infrastructure:**
- Use `match_documents()` RPC function
- Same `documents` table and embeddings
- Filter by `project` and `source_file` (already implemented)

**No schema changes needed** - all required data already exists

### Dependencies

**New packages:**

```json
{
  "umap-js": "^1.4.0"
}
```

**Optional (for clustering):**
- Simple k-means implementation (~50 lines, can write ourselves)
- Or: `ml-kmeans` package

**Visualization:**
- HTML5 Canvas (native) or React viz library
- Recommendation: Canvas for performance

## Data Flow

### Complete Flow Diagram

```
User types query + sets filters
  ↓
SearchInput validates → semanticSearch() server action
  ↓
Embed query (OpenAI) → match_documents(embedding, filters)
  ↓
Filter by minSimilarity → Return { results[], metadata }
  ↓
Client receives results with embeddings
  ↓
  ├─→ UMAP computation → K-means clustering → ClusterVisualization
  └─→ ResultsList (flat view)
  ↓
User interactions:
  - Hover/click viz point → Highlight result
  - Click "Show Context" → getChunkContext() → Expand card
  - Toggle flat/grouped view → Re-render ResultsList
```

### Latency Breakdown

1. **Embedding generation**: ~200ms (OpenAI API)
2. **Database query**: ~50-100ms (vector similarity search)
3. **UMAP computation**: ~500-1000ms (client-side, 20-50 points)
4. **Total**: ~750-1300ms (acceptable for exploratory use)

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| **No results found** | Show: "No passages found. Try a broader search or lower similarity threshold." |
| **Query too short** | Inline validation: "Enter at least 3 characters" |
| **Server/embedding error** | Display: "Search failed: [error]" with retry suggestion |
| **UMAP slow (>2s)** | Show spinner, allow list view while viz loads |
| **Context chunks missing** | Show: "No previous/following chunk" (first/last in document) |
| **50+ results requested** | Warning: "Visualization works best with ≤50 results. Show top 30 in viz?" |

## Instrumentation & Metrics

### Track for Learning

- **Search latency breakdown:**
  - Embedding generation time
  - Database retrieval time
  - UMAP computation time
- **Token usage**: Embedding only (~$0.02/1M tokens)
- **Results stats**: Count, threshold filtering
- **User interactions**: Clicks, context expansions, view toggles

### Display to User

Below results, show:
- "Found 18 passages in 234ms"
- "Filtered 2 results below similarity threshold"
- "Cost: $0.0001"

Consistent with existing instrumentation philosophy (transparency for learning).

## Future Enhancements (Out of Scope)

### Search Modes
- **Find Similar Passages** - Paste a passage, find similar ones across corpus
- **Compare Across Papers** - Side-by-side comparison of how papers discuss a concept

### Export & Annotation
- Export results to CSV for qualitative coding
- Save search as "saved query"
- Tag passages with research themes/codes
- Build research notes

### Advanced Visualizations
- Timeline view (results by publication year)
- Network graph (citation relationships)
- Heatmap (concept frequency across papers)

## Implementation Notes

### Phased Approach

**Phase 1: Core Search (MVP)**
- Basic search input (concept mode only)
- Flat results list with similarity scores
- Simple metadata display
- No visualization yet

**Phase 2: Visualization**
- Add UMAP scatter plot
- Cluster coloring
- Hover/click interactions

**Phase 3: Polish**
- Grouped view toggle
- "Show Context" feature
- Advanced filters (project, document selection)
- Similarity threshold slider

**Phase 4: Future Modes**
- "Find Similar Passages" search mode
- Export features
- Additional visualizations

### Code Reuse

- Leverage existing `retrieveDocuments()` logic from `lib/vectordb/retriever.ts`
- Reuse document selection UI patterns from `/query`
- Follow existing Server Action patterns
- Maintain instrumentation consistency (latency, cost tracking)

### Design Principles

- **YAGNI**: Start simple, add features as needed
- **Learning-focused**: Instrument everything for research insights
- **Transparent**: Show how the system works (similarity scores, clustering)
- **Exploratory**: Support open-ended research, not just Q&A

## Success Criteria

This feature succeeds if it enables:
1. **Concept exploration** - "What do papers say about X?" without pre-formed questions
2. **Pattern discovery** - Visual clustering reveals sub-topics and connections
3. **Source identification** - Grouped view answers "Which papers discuss this?"
4. **Context preservation** - "Show Context" maintains semantic coherence
5. **Research workflow** - Lower barrier to exploratory analysis vs. chat interface

## Open Questions

None - design is complete and validated.

## References

- Existing chat interface: `/query`
- Document library: `app/query/DocumentList.tsx`
- Vector retrieval: `lib/vectordb/retriever.ts`
- UMAP algorithm: https://umap-learn.readthedocs.io/
- Project context: `CLAUDE.md`
