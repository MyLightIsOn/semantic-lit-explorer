'use client'

import { useState } from 'react'
import MetadataDisplay from '../upload/MetadataDisplay'
import type { PipelineSteps, QueryMetadata } from '../actions/queryDocuments'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pipelineSteps?: PipelineSteps
  metadata?: QueryMetadata
  timestamp: Date
}

type MessageListProps = {
  messages: Message[]
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '8px',
          maxWidth: '80%',
        }}
      >
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  )
}

function AssistantMessage({ message }: { message: Message }) {
  const [showPipeline, setShowPipeline] = useState(false)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          backgroundColor: '#e3f2fd',
          padding: '1rem',
          borderRadius: '8px',
          maxWidth: '80%',
          marginLeft: 'auto',
        }}
      >
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>

        {message.pipelineSteps && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => setShowPipeline(!showPipeline)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0070f3',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: 0,
              }}
            >
              {showPipeline ? '▾' : '▸'} View Pipeline Details
            </button>

            {showPipeline && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Step 1: Reformulated Question</strong>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    {message.pipelineSteps.reformulatedQuestion}
                  </p>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Step 2: Document Retrieval</strong>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Retrieved {message.pipelineSteps.documentsRetrieved} relevant documents
                  </p>
                </div>

                <div>
                  <strong>Step 3: Generated Answer</strong>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>[Answer shown above]</p>
                </div>
              </div>
            )}
          </div>
        )}

        {message.metadata && (
          <div style={{ marginTop: '1rem' }}>
            <MetadataDisplay type="query" metadata={message.metadata} />
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: '#999',
          marginTop: '0.25rem',
          textAlign: 'right',
        }}
      >
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  )
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div>
      {messages.map((message) =>
        message.role === 'user' ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage key={message.id} message={message} />
        )
      )}
    </div>
  )
}
