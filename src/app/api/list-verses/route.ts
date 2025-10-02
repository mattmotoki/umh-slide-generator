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
    const chapter = parseInt(searchParams.get('chapter') || '1', 10);
    if (!book || !chapter) return NextResponse.json([], { status: 200 });

    const filePath = path.join(process.cwd(), 'public', 'data', 'bibles', version, `${book}_chapter_${chapter}.json`);
    if (!fs.existsSync(filePath)) return NextResponse.json([], { status: 200 });

    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    const verses: number[] = (json.verses || [])
      .map((v: any) => v.verse)
      .filter((n: any) => typeof n === 'number');
    const unique = Array.from(new Set(verses)).sort((a, b) => a - b);
    return NextResponse.json(unique);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to list verses' }, { status: 500 });
  }
}


