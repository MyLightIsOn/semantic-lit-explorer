'use client'

import { useState, useEffect } from 'react'
import { getDocuments, getProjects, type DocumentRecord } from '../actions/getDocuments'
import { deleteDocuments } from '../actions/deleteDocuments'

const ITEMS_PER_PAGE = 10

type DocumentListProps = {
  selectedDocuments: string[]
  onSelectionChange: (selected: string[]) => void
  selectedProject: string
  onProjectChange: (project: string) => void
}

export default function DocumentList({
  selectedDocuments,
  onSelectionChange,
  selectedProject,
  onProjectChange
}: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletionInProgress, setDeletionInProgress] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [availableProjects, setAvailableProjects] = useState<string[]>([])

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

  useEffect(() => {
    async function fetchProjects() {
      const result = await getProjects()
      if (result.success && result.projects) {
        setAvailableProjects(result.projects)
      }
    }

    fetchProjects()
  }, [])

  // Filter documents by selected project
  const filteredDocuments = selectedProject === '__unassigned__'
    ? documents.filter((doc) => !doc.project)
    : selectedProject
      ? documents.filter((doc) => doc.project === selectedProject)
      : documents

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown'
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  const handleSelectAll = () => {
    const allSourceFiles = filteredDocuments.map((doc) => doc.source_file).filter(Boolean) as string[]
    onSelectionChange(allSourceFiles)
  }

  const handleDeselectAll = () => {
    onSelectionChange([])
  }

  const handleToggleDocument = (sourceFile: string) => {
    if (selectedDocuments.includes(sourceFile)) {
      onSelectionChange(selectedDocuments.filter((sf) => sf !== sourceFile))
    } else {
      onSelectionChange([...selectedDocuments, sourceFile])
    }
  }

  const handleDeleteClick = () => {
    setDeleteError(null)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setDeletionInProgress(true)
    setDeleteError(null)

    const result = await deleteDocuments(selectedDocuments)

    if (result.success) {
      // Refresh document list
      const documentsResult = await getDocuments()
      if (documentsResult.success && documentsResult.documents) {
        setDocuments(documentsResult.documents)

        // Adjust current page if needed
        const newTotalPages = Math.ceil(documentsResult.documents.length / ITEMS_PER_PAGE)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        }
      }

      // Clear selection
      onSelectionChange([])
      setShowDeleteDialog(false)
    } else {
      setDeleteError(result.error || 'Failed to delete documents')
    }

    setDeletionInProgress(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setDeleteError(null)
  }

  const allSelected = filteredDocuments.length > 0 && selectedDocuments.length === filteredDocuments.length

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
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} in your library
          {selectedProject && ` (${filteredDocuments.length} in ${selectedProject === '__unassigned__' ? 'Unassigned' : selectedProject})`}
        </p>

        {/* Project Filter */}
        {availableProjects.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="project-filter"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.25rem',
              }}
            >
              Filter by Project:
            </label>
            <select
              id="project-filter"
              value={selectedProject}
              onChange={(e) => {
                onProjectChange(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                padding: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '300px',
              }}
            >
              <option value="">All Projects ({documents.length} documents)</option>
              {availableProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj} ({documents.filter((d) => d.project === proj).length})
                </option>
              ))}
              <option value="__unassigned__">
                Unassigned ({documents.filter((d) => !d.project).length})
              </option>
            </select>
          </div>
        )}

        {documents.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <button
              onClick={handleSelectAll}
              disabled={allSelected}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: allSelected ? '#e0e0e0' : '#0070f3',
                color: allSelected ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: allSelected ? 'not-allowed' : 'pointer',
              }}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={selectedDocuments.length === 0}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: selectedDocuments.length === 0 ? '#e0e0e0' : '#6c757d',
                color: selectedDocuments.length === 0 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedDocuments.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Deselect All
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={selectedDocuments.length === 0}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: selectedDocuments.length === 0 ? '#e0e0e0' : '#dc3545',
                color: selectedDocuments.length === 0 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedDocuments.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Delete Selected ({selectedDocuments.length})
            </button>
            <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 'auto' }}>
              {selectedDocuments.length > 0
                ? `${selectedDocuments.length} selected`
                : 'None selected (querying all)'}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', width: '40px' }}>
                Select
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Title</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Authors</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Year</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>DOI</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Project</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Uploaded</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Chunks</th>
            </tr>
          </thead>
          <tbody>
            {currentDocuments.map((doc, idx) => {
              const isSelected = doc.source_file ? selectedDocuments.includes(doc.source_file) : false
              return (
                <tr
                  key={doc.source_file || idx}
                  style={{
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: isSelected
                      ? '#e3f2fd'
                      : idx % 2 === 0
                        ? 'white'
                        : '#fafafa',
                  }}
                >
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => doc.source_file && handleToggleDocument(doc.source_file)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
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
                <td style={{ padding: '0.75rem' }}>
                  {doc.project ? (
                    <span
                      style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      {doc.project}
                    </span>
                  ) : (
                    <span style={{ color: '#999', fontSize: '0.875rem' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem', color: '#666' }}>
                  {formatDate(doc.upload_date)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                  {doc.chunk_count}
                </td>
              </tr>
              )
            })}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
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
          }}
          onClick={handleDeleteCancel}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ⚠️ Confirm Deletion
            </h3>

            <p style={{ color: '#666', marginBottom: '1rem' }}>
              You are about to permanently delete {selectedDocuments.length} document
              {selectedDocuments.length !== 1 ? 's' : ''}:
            </p>

            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {selectedDocuments.slice(0, 5).map((sourceFile) => {
                const doc = documents.find((d) => d.source_file === sourceFile)
                return (
                  <div key={sourceFile} style={{ marginBottom: '0.5rem' }}>
                    <strong>{doc?.document_title || sourceFile}</strong>
                  </div>
                )
              })}
              {selectedDocuments.length > 5 && (
                <div style={{ color: '#666', fontStyle: 'italic' }}>
                  +{selectedDocuments.length - 5} more...
                </div>
              )}
            </div>

            <p style={{ color: '#dc3545', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              This action cannot be undone. All chunks and vectors will be permanently removed.
            </p>

            {deleteError && (
              <div
                style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                Error: {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleDeleteCancel}
                disabled={deletionInProgress}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deletionInProgress ? 'not-allowed' : 'pointer',
                  opacity: deletionInProgress ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletionInProgress}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deletionInProgress ? 'not-allowed' : 'pointer',
                  opacity: deletionInProgress ? 0.5 : 1,
                }}
              >
                {deletionInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
