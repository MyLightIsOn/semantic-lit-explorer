'use client'

import { useState, useRef, useEffect } from 'react'
import { queryDocuments, type PipelineSteps, type QueryMetadata } from '../actions/queryDocuments'
import MessageList from './MessageList'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pipelineSteps?: PipelineSteps
  metadata?: QueryMetadata
  timestamp: Date
}

type ChatInterfaceProps = {
  selectedDocuments: string[]
}

export default function ChatInterface({ selectedDocuments }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call Server Action with optional document filtering
      const result = await queryDocuments(trimmedInput, selectedDocuments.length > 0 ? selectedDocuments : undefined)

      if (result.success && result.answer) {
        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.answer,
          pipelineSteps: result.pipelineSteps,
          metadata: result.metadata,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Failed to process query: ${result.error || 'Unknown error'}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Query scope indicator */}
      <div
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: selectedDocuments.length > 0 ? '#fff3cd' : '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          border: `1px solid ${selectedDocuments.length > 0 ? '#ffc107' : '#90caf9'}`,
        }}
      >
        <strong>Query Scope:</strong>{' '}
        {selectedDocuments.length > 0
          ? `Searching ${selectedDocuments.length} selected document${selectedDocuments.length !== 1 ? 's' : ''}`
          : 'Searching all documents'}
      </div>

      {/* Message list - scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '1rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem',
          minHeight: 0,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
            <p>Ask a question about your documents to get started.</p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form - fixed at bottom */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isLoading || !input.trim() ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
