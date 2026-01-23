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
  const [manualDoi, setManualDoi] = useState<string>('')

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
    if (!selectedFile || !summary?.documentMetadata) return

    setState('loading')
    setResult(null)
    setLoadingMetadata(null)

    const formData = new FormData()
    formData.append('pdf', selectedFile)

    // Use manual DOI if provided, otherwise use AI-extracted DOI
    const finalMetadata = {
      ...summary.documentMetadata,
      doi: manualDoi.trim() || summary.documentMetadata.doi,
    }

    try {
      const response = await uploadAndLoadDocument(formData, finalMetadata)

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
          setManualDoi('')
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
    setManualDoi('')
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
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Document Summary</h3>

            {/* Document Metadata */}
            {summary.documentMetadata && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: 'white',
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
            )}

            {/* Manual DOI Input */}
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                border: '1px solid #ffc107',
              }}
            >
              <label
                htmlFor="manual-doi"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                }}
              >
                Manual DOI Override (optional):
              </label>
              <input
                type="text"
                id="manual-doi"
                value={manualDoi}
                onChange={(e) => setManualDoi(e.target.value)}
                placeholder={
                  summary.documentMetadata?.doi
                    ? 'Leave blank to use AI-extracted DOI'
                    : 'Enter DOI if not auto-detected (e.g., 10.1145/3551349.3556968)'
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                {summary.documentMetadata?.doi
                  ? 'AI detected a DOI. Enter here only if you want to override it.'
                  : 'No DOI was detected. You can manually enter it here.'}
              </div>
            </div>

            <div style={{ lineHeight: '1.6', color: '#333', marginTop: '1rem' }}>
              {summary.summary}
            </div>
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
