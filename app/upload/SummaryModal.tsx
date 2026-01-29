'use client'

import type { FileEntry } from './FileTable'
import MetadataDisplay from './MetadataDisplay'

type SummaryModalProps = {
  fileEntry: FileEntry
  onClose: () => void
}

export default function SummaryModal({ fileEntry, onClose }: SummaryModalProps) {
  const summary = fileEntry.summary

  if (!summary || !summary.documentMetadata) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            Document Summary
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: '1',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Document Metadata */}
          <div
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Title:</strong> {summary.documentMetadata.title}
            </div>
            {summary.documentMetadata.authors.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Authors:</strong> {summary.documentMetadata.authors.join(', ')}
              </div>
            )}
            {summary.documentMetadata.publicationYear && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Year:</strong> {summary.documentMetadata.publicationYear}
              </div>
            )}
            {summary.documentMetadata.doi && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>DOI:</strong>{' '}
                <a
                  href={`https://doi.org/${summary.documentMetadata.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0070f3', textDecoration: 'underline' }}
                >
                  {summary.documentMetadata.doi}
                </a>
              </div>
            )}
            <div>
              <strong>File:</strong> {summary.fileName} ({summary.pageCount} pages)
            </div>
          </div>

          {/* Summary Text */}
          <div
            style={{
              lineHeight: '1.6',
              color: '#333',
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Summary:</strong>
            {summary.summary}
          </div>

          {/* Metadata */}
          {summary.metadata && <MetadataDisplay type="summarization" metadata={summary.metadata} />}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
