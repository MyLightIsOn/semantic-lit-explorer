'use client'

import { useState, useEffect } from 'react'
import { getDocuments, type DocumentRecord } from '../actions/getDocuments'

const ITEMS_PER_PAGE = 10

export default function DocumentList() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true)
      setError(null)

      const result = await getDocuments()

      if (result.success && result.documents) {
        setDocuments(result.documents)
      } else {
        setError(result.error || 'Failed to load documents')
      }

      setLoading(false)
    }

    fetchDocuments()
  }, [])

  const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentDocuments = documents.slice(startIndex, endIndex)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown'
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        Loading documents...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
        }}
      >
        Error: {error}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        No documents uploaded yet. Upload a PDF to get started.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Document Library
        </h2>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} in your library
        </p>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Title</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Authors</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Year</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>DOI</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Uploaded</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Chunks</th>
            </tr>
          </thead>
          <tbody>
            {currentDocuments.map((doc, idx) => (
              <tr
                key={doc.source_file || idx}
                style={{
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa',
                }}
              >
                <td
                  style={{
                    padding: '0.75rem',
                    fontWeight: '500',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={doc.document_title || 'Untitled'}
                >
                  {doc.document_title || 'Untitled'}
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    color: '#666',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={doc.authors?.join(', ') || 'Unknown'}
                >
                  {doc.authors && doc.authors.length > 0 ? doc.authors.join(', ') : 'Unknown'}
                </td>
                <td style={{ padding: '0.75rem', color: '#666' }}>
                  {doc.publication_year || '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {doc.doi ? (
                    <a
                      href={`${doc.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}
                      title={doc.doi}
                    >
                      {doc.doi}
                    </a>
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem', color: '#666' }}>
                  {formatDate(doc.upload_date)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                  {doc.chunk_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ color: '#666' }}>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === 1 ? '#e0e0e0' : '#0070f3',
                color: currentPage === 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentPage === totalPages ? '#e0e0e0' : '#0070f3',
                color: currentPage === totalPages ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
