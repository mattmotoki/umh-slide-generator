import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'United Methodist Hymnal Slide Generator',
  description: 'Generate PowerPoint slides for United Methodist Hymnal songs',
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