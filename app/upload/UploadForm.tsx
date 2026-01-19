'use client'

import { useState } from 'react'
import { summarizePdf, type SummarizePdfResult } from '../actions/summarizePdf'
import { uploadAndLoadDocument } from '../actions/uploadDocument'
import { type LoadingMetadata } from '../actions/loadDocuments'
import MetadataDisplay from './MetadataDisplay'

type UploadState = 'idle' | 'summarizing' | 'reviewing' | 'loading' | 'complete'

export default function UploadForm() {
  const [state, setState] = useState<UploadState>('idle')
  const [summary, setSummary] = useState<SummarizePdfResult | null>(null)
  const [loadingMetadata, setLoadingMetadata] = useState<LoadingMetadata | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handleInitialSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('summarizing')
    setResult(null)
    setSummary(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('pdf') as File

    if (!file || file.size === 0) {
      setResult({ success: false, message: 'Please select a PDF file' })
      setState('idle')
      return
    }

    // Store file for later use
    setSelectedFile(file)

    try {
      const summaryResult = await summarizePdf(formData)

      if (summaryResult.success) {
        setSummary(summaryResult)
        setState('reviewing')
      } else {
        setResult({
          success: false,
          message: `❌ Error: ${summaryResult.error}`,
        })
        setState('idle')
        setSelectedFile(null)
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      setState('idle')
      setSelectedFile(null)
    }
  }

  async function handleConfirmLoad() {
    if (!selectedFile) return

    setState('loading')
    setResult(null)
    setLoadingMetadata(null)

    const formData = new FormData()
    formData.append('pdf', selectedFile)

    try {
      const response = await uploadAndLoadDocument(formData)

      if (response.success) {
        setResult({
          success: true,
          message: `✅ Successfully loaded ${response.chunksLoaded} chunks from ${selectedFile.name}`,
        })
        if (response.metadata) {
          setLoadingMetadata(response.metadata)
        }
        setState('complete')
        // Reset after a delay
        setTimeout(() => {
          setState('idle')
          setSummary(null)
          setLoadingMetadata(null)
          setSelectedFile(null)
          setResult(null)
        }, 10000)
      } else {
        setResult({
          success: false,
          message: `❌ Error: ${response.error}`,
        })
        setState('reviewing')
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      setState('reviewing')
    }
  }

  function handleCancel() {
    setState('idle')
    setSummary(null)
    setLoadingMetadata(null)
    setSelectedFile(null)
    setResult(null)
  }

  return (
    <div>
      {/* Initial Upload Form */}
      {(state === 'idle' || state === 'summarizing') && (
        <form onSubmit={handleInitialSubmit} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="pdf"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}
            >
              Select PDF file:
            </label>
            <input
              type="file"
              id="pdf"
              name="pdf"
              accept=".pdf,application/pdf"
              required
              disabled={state === 'summarizing'}
              style={{
                display: 'block',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={state === 'summarizing'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: state === 'summarizing' ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: state === 'summarizing' ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
            }}
          >
            {state === 'summarizing' ? 'Generating Summary...' : 'Upload and Summarize'}
          </button>
        </form>
      )}

      {/* Summarizing Progress */}
      {state === 'summarizing' && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0 }}>⏳ Extracting text and generating AI summary...</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
            This may take 30 seconds.
          </p>
        </div>
      )}

      {/* Summary Review */}
      {state === 'reviewing' && summary && (
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Document Summary</h3>
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>File:</strong> {summary.fileName} ({summary.pageCount} pages)
            </div>
            <div style={{ lineHeight: '1.6', color: '#333' }}>{summary.summary}</div>
          </div>

          {/* Show summarization metadata */}
          {summary.metadata && (
            <div style={{ marginBottom: '1rem' }}>
              <MetadataDisplay type="summarization" metadata={summary.metadata} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleConfirmLoad}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
              }}
            >
              ✓ Confirm and Load to Database
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
              }}
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading Progress */}
      {state === 'loading' && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0 }}>
            ⏳ Loading into database: splitting text, generating embeddings, and storing...
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
            This may take a minute depending on the PDF size.
          </p>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <>
          <div
            style={{
              padding: '1rem',
              backgroundColor: result.success ? '#d4edda' : '#f8d7da',
              color: result.success ? '#155724' : '#721c24',
              borderRadius: '4px',
              border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
              marginBottom: loadingMetadata ? '1rem' : 0,
            }}
          >
            <p style={{ margin: 0 }}>{result.message}</p>
            {state === 'complete' && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                Form will reset in 10 seconds...
              </p>
            )}
          </div>

          {/* Show loading metadata after successful load */}
          {loadingMetadata && state === 'complete' && (
            <MetadataDisplay type="loading" metadata={loadingMetadata} />
          )}
        </>
      )}
    </div>
  )
}
