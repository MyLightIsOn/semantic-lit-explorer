'use client'

import type { SummarizePdfResult } from '../actions/summarizePdf'
import type { LoadingMetadata } from '../actions/loadDocuments'

export type FileStatus = 'pending' | 'summarizing' | 'summarized' | 'uploading' | 'complete' | 'error'

export type FileEntry = {
  id: string
  file: File
  status: FileStatus
  summary?: SummarizePdfResult
  error?: string
  loadingMetadata?: LoadingMetadata
}

type FileTableProps = {
  files: FileEntry[]
  onSummarize: (fileId: string) => void
  onRemove: (fileId: string) => void
  onViewSummary: (fileId: string) => void
  isUploading: boolean
}

export default function FileTable({
  files,
  onSummarize,
  onRemove,
  onViewSummary,
  isUploading,
}: FileTableProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = (status: FileStatus) => {
    const styles: Record<FileStatus, { bg: string; color: string; text: string }> = {
      pending: { bg: '#e0e0e0', color: '#666', text: 'Pending' },
      summarizing: { bg: '#fff3cd', color: '#856404', text: 'Summarizing...' },
      summarized: { bg: '#d4edda', color: '#155724', text: 'Summarized' },
      uploading: { bg: '#cce5ff', color: '#004085', text: 'Uploading...' },
      complete: { bg: '#d4edda', color: '#155724', text: 'Complete' },
      error: { bg: '#f8d7da', color: '#721c24', text: 'Error' },
    }

    const style = styles[status]

    return (
      <span
        style={{
          backgroundColor: style.bg,
          color: style.color,
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '500',
        }}
      >
        {style.text}
      </span>
    )
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '1rem',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Filename</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Size</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((entry, idx) => (
            <tr
              key={entry.id}
              style={{
                backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa',
                borderBottom: '1px solid #e0e0e0',
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
                title={entry.file.name}
              >
                {entry.file.name}
              </td>
              <td style={{ padding: '0.75rem', color: '#666' }}>
                {formatFileSize(entry.file.size)}
              </td>
              <td style={{ padding: '0.75rem' }}>{getStatusBadge(entry.status)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {entry.status === 'pending' && (
                    <button
                      onClick={() => onSummarize(entry.id)}
                      disabled={isUploading}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        backgroundColor: isUploading ? '#e0e0e0' : '#0070f3',
                        color: isUploading ? '#999' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Summarize
                    </button>
                  )}
                  {entry.status === 'summarized' && (
                    <button
                      onClick={() => onViewSummary(entry.id)}
                      disabled={isUploading}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        backgroundColor: isUploading ? '#e0e0e0' : '#28a745',
                        color: isUploading ? '#999' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      View Summary
                    </button>
                  )}
                  {entry.status === 'error' && entry.error && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#721c24',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={entry.error}
                    >
                      {entry.error}
                    </span>
                  )}
                  <button
                    onClick={() => onRemove(entry.id)}
                    disabled={
                      isUploading ||
                      entry.status === 'uploading' ||
                      entry.status === 'summarizing'
                    }
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor:
                        isUploading ||
                        entry.status === 'uploading' ||
                        entry.status === 'summarizing'
                          ? '#e0e0e0'
                          : '#dc3545',
                      color:
                        isUploading ||
                        entry.status === 'uploading' ||
                        entry.status === 'summarizing'
                          ? '#999'
                          : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor:
                        isUploading ||
                        entry.status === 'uploading' ||
                        entry.status === 'summarizing'
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
