import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req, { params }) {
  const { filename } = await params

  // Security: only serve invoice PDFs
  if (!/^invoice-[\w-]+\.pdf$/.test(filename)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'invoices', filename)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
