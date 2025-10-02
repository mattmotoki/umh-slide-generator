import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = (searchParams.get('version') || 'nrsvue').toLowerCase();
    const book = (searchParams.get('book') || '').toUpperCase();
    if (!book) return NextResponse.json([], { status: 200 });

    const dirPath = path.join(process.cwd(), 'public', 'data', 'bibles', version);
    if (!fs.existsSync(dirPath)) return NextResponse.json([], { status: 200 });

    const files = fs.readdirSync(dirPath);
    const chapters: number[] = [];
    const prefix = `${book}_chapter_`;
    for (const f of files) {
      if (f.startsWith(prefix) && f.endsWith('.json')) {
        const nStr = f.substring(prefix.length, f.length - '.json'.length);
        const n = parseInt(nStr, 10);
        if (!Number.isNaN(n)) chapters.push(n);
      }
    }
    chapters.sort((a, b) => a - b);
    return NextResponse.json(chapters);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to list chapters' }, { status: 500 });
  }
}


