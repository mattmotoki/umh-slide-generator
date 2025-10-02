import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Church Material Automation',
  description: 'Automate church material creation from Planning Center exports',
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