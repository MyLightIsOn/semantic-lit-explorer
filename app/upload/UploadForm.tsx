'use client'

import { useState } from 'react'
import { summarizePdf } from '../actions/summarizePdf'
import { uploadAndLoadDocument } from '../actions/uploadDocument'
import type { DocumentMetadata } from '../actions/summarizePdf'
import FileTable, { type FileEntry } from './FileTable'
import SummaryModal from './SummaryModal'

export default function UploadForm() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [projectName, setProjectName] = useState<string>('')
  const [modalFile, setModalFile] = useState<FileEntry | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || [])

    if (selectedFiles.length === 0) return

    const newEntries: FileEntry[] = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending' as const,
    }))

    setFiles((prev) => [...prev, ...newEntries])

    // Reset file input
    e.target.value = ''
  }

  async function handleSummarize(fileId: string) {
    const entry = files.find((f) => f.id === fileId)
    if (!entry) return

    // Update status to summarizing
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'summarizing' as const } : f))
    )

    try {
      const formData = new FormData()
      formData.append('pdf', entry.file)

      const result = await summarizePdf(formData)

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'summarized' as const, summary: result }
              : f
          )
        )
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'error' as const, error: result.error || 'Summarization failed' }
              : f
          )
        )
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            : f
        )
      )
    }
  }

  async function handleUploadAll() {
    setIsUploading(true)

    for (const entry of files) {
      // Skip files that are already complete or currently in error state that we're retrying
      if (entry.status === 'complete') continue

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading' as const } : f))
      )

      try {
        // Use AI-extracted metadata if available, otherwise use defaults
        const metadata: DocumentMetadata = entry.summary?.documentMetadata ?? {
          title: entry.file.name.replace('.pdf', ''),
          authors: [],
          publicationYear: null,
          doi: null,
          sourceFile: entry.file.name,
          project: null,
        }

        // Add project to metadata
        const finalMetadata: DocumentMetadata = {
          ...metadata,
          project: projectName.trim() || null,
        }

        const formData = new FormData()
        formData.append('pdf', entry.file)

        const result = await uploadAndLoadDocument(formData, finalMetadata)

        if (result.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: 'complete' as const,
                    loadingMetadata: result.metadata,
                  }
                : f
            )
          )
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: 'error' as const,
                    error: result.error || 'Upload failed',
                  }
                : f
            )
          )
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Unknown error',
                }
              : f
          )
        )
      }
    }

    setIsUploading(false)
  }

  function handleRemoveFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  function handleViewSummary(fileId: string) {
    const entry = files.find((f) => f.id === fileId)
    if (entry && entry.summary) {
      setModalFile(entry)
    }
  }

  function handleClearAll() {
    setFiles([])
    setProjectName('')
  }

  const hasFiles = files.length > 0
  const allComplete = files.every((f) => f.status === 'complete')
  const hasErrors = files.some((f) => f.status === 'error')

  return (
    <div>
      {/* File Input */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="pdf"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
          }}
        >
          Select PDF file(s):
        </label>
        <input
          type="file"
          id="pdf"
          name="pdf"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFilesSelected}
          disabled={isUploading}
          style={{
            display: 'block',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '100%',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
          You can select multiple PDF files at once
        </p>
      </div>

      {/* Project Input */}
      {hasFiles && (
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="project-name"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              fontSize: '0.875rem',
            }}
          >
            Project (optional, applies to all files):
          </label>
          <input
            type="text"
            id="project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Vector Databases, RAG Systems, LLM Architectures"
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Organize all uploaded documents by research topic
          </div>
        </div>
      )}

      {/* File Table */}
      {hasFiles && (
        <FileTable
          files={files}
          onSummarize={handleSummarize}
          onRemove={handleRemoveFile}
          onViewSummary={handleViewSummary}
          isUploading={isUploading}
        />
      )}

      {/* Action Buttons */}
      {hasFiles && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={handleUploadAll}
            disabled={isUploading || allComplete}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isUploading || allComplete ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isUploading || allComplete ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
            }}
          >
            {isUploading ? 'Uploading...' : allComplete ? 'All Complete' : 'Upload All'}
          </button>
          <button
            onClick={handleClearAll}
            disabled={isUploading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isUploading ? '#e0e0e0' : '#6c757d',
              color: isUploading ? '#999' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Status Messages */}
      {allComplete && hasFiles && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
            marginBottom: '1rem',
          }}
        >
          ✅ All documents uploaded successfully! {files.length} file
          {files.length !== 1 ? 's' : ''} processed.
        </div>
      )}

      {hasErrors && !isUploading && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
            border: '1px solid #ffc107',
            marginBottom: '1rem',
          }}
        >
          ⚠️ Some files had errors. You can retry by clicking "Upload All" again or remove the
          failed files.
        </div>
      )}

      {/* Summary Modal */}
      {modalFile && <SummaryModal fileEntry={modalFile} onClose={() => setModalFile(null)} />}
    </div>
  )
}
