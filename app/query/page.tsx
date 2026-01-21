import Link from 'next/link'
import ChatInterface from './ChatInterface'

export default function QueryPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Query Documents</h1>
        <p style={{ color: '#666' }}>Ask questions about your research papers using semantic search</p>
      </div>

      <ChatInterface />
    </div>
  )
}
