'use client'

import { useState } from 'react'
import Link from 'next/link'
import ChatInterface from './ChatInterface'
import DocumentList from './DocumentList'

export default function QueryPage() {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #e0e0e0' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to Home
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
          Query Documents
        </h1>
      </div>

      {/* Split Screen Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Side - Document List */}
        <div
          style={{
            width: '40%',
            borderRight: '1px solid #e0e0e0',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <DocumentList
            selectedDocuments={selectedDocuments}
            onSelectionChange={setSelectedDocuments}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
          />
        </div>

        {/* Right Side - Chat Interface */}
        <div
          style={{
            width: '60%',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Ask Questions
            </h2>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              Ask questions about your research papers using semantic search
            </p>
          </div>
          <ChatInterface selectedDocuments={selectedDocuments} selectedProject={selectedProject} />
        </div>
      </div>
    </div>
  )
}
