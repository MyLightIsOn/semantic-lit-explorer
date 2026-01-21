import type { SummarizationMetadata } from '../actions/summarizePdf'
import type { LoadingMetadata } from '../actions/loadDocuments'
import type { QueryMetadata } from '../actions/queryDocuments'

type MetadataDisplayProps = {
  type: 'summarization' | 'loading' | 'query'
  metadata: SummarizationMetadata | LoadingMetadata | QueryMetadata
}

export default function MetadataDisplay({ type, metadata }: MetadataDisplayProps) {
  const formatCost = (cost: number) => {
    return cost < 0.01 ? `< $0.01` : `$${cost.toFixed(4)}`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #dee2e6',
        fontSize: '0.875rem',
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '600' }}>
        {type === 'summarization'
          ? '📊 Summarization Metrics'
          : type === 'loading'
            ? '📊 Loading Metrics'
            : '📊 Query Metrics'}
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {type === 'summarization' && 'modelUsed' in metadata && (
          <>
            <MetricItem label="Latency" value={formatLatency(metadata.latencyMs)} />
            <MetricItem label="Model" value={metadata.modelUsed} />
            <MetricItem
              label="Tokens (total)"
              value={formatNumber(metadata.tokensUsed.total)}
              subtitle={`${formatNumber(metadata.tokensUsed.prompt)} in / ${formatNumber(metadata.tokensUsed.completion)} out`}
            />
            <MetricItem label="Estimated Cost" value={formatCost(metadata.estimatedCost)} />
            <MetricItem
              label="Chars Processed"
              value={formatNumber(metadata.charactersProcessed)}
            />
          </>
        )}

        {type === 'loading' && 'chunks' in metadata && (
          <>
            <MetricItem label="Latency" value={formatLatency(metadata.latencyMs)} />
            <MetricItem label="Pages" value={formatNumber(metadata.pages)} />
            <MetricItem label="Chunks Created" value={formatNumber(metadata.chunks)} />
            <MetricItem
              label="Embeddings"
              value={formatNumber(metadata.embeddingsGenerated)}
            />
            <MetricItem
              label="Estimated Tokens"
              value={formatNumber(metadata.estimatedTokens)}
            />
            <MetricItem label="Estimated Cost" value={formatCost(metadata.estimatedCost)} />
          </>
        )}

        {type === 'query' && 'totalLatencyMs' in metadata && (
          <>
            <MetricItem
              label="Total Latency"
              value={formatLatency(metadata.totalLatencyMs)}
              subtitle={`Reformulation: ${formatLatency(metadata.reformulationLatency)} | Retrieval: ${formatLatency(metadata.retrievalLatency)} | Answer: ${formatLatency(metadata.answerLatency)}`}
            />
            <MetricItem
              label="Documents Retrieved"
              value={formatNumber(metadata.documentsRetrieved)}
            />
            <MetricItem
              label="Total Tokens"
              value={formatNumber(metadata.tokensUsed.total)}
              subtitle={`Reformulation: ${formatNumber(metadata.tokensUsed.reformulation.total)} | Answer: ${formatNumber(metadata.tokensUsed.answer.total)}`}
            />
            <MetricItem label="Estimated Cost" value={formatCost(metadata.estimatedCost)} />
          </>
        )}
      </div>
    </div>
  )
}

function MetricItem({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle?: string
}) {
  return (
    <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px' }}>
      <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontWeight: '600', color: '#333' }}>{value}</div>
      {subtitle && (
        <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '0.25rem' }}>{subtitle}</div>
      )}
    </div>
  )
}
