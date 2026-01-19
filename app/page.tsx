import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Semantic Literature Explorer</h1>
      <p>
        A vector-database-backed research instrument for exploring LLM system architectures
        through semantic retrieval.
      </p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Features</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>
            <Link
              href="/upload"
              style={{
                color: '#0070f3',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Upload PDF
            </Link>{' '}
            - Add research papers to the vector database
          </li>
          <li style={{ color: '#999' }}>Query Documents - Coming soon</li>
          <li style={{ color: '#999' }}>Semantic Search - Coming soon</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>How it works</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Upload a research paper (PDF)</li>
          <li>AI generates a summary of the paper</li>
          <li>Review the summary and decide whether to add it</li>
          <li>If confirmed, text is split into semantic chunks</li>
          <li>Chunks are embedded using OpenAI and stored in Supabase</li>
        </ol>
      </div>
    </main>
  )
}
