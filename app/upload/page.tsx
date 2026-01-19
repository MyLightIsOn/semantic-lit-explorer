import Link from 'next/link'
import UploadForm from './UploadForm'

export default function UploadPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link
        href="/"
        style={{
          color: '#0070f3',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '1rem',
        }}
      >
        ← Back to Home
      </Link>

      <h1>Upload PDF</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Upload a research paper. An AI will summarize it, then you can decide whether to add it to the vector database.
      </p>
      <UploadForm />
    </main>
  )
}
