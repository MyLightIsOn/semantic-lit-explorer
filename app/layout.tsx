import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Semantic Literature Explorer',
  description: 'A vector-database-backed research instrument for exploring LLM system architectures through semantic retrieval',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
