import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = (searchParams.get('version') || 'nrsvue').toLowerCase();

    const dirPath = path.join(process.cwd(), 'public', 'data', 'bibles', version);
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json([], { status: 200 });
    }

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
    const codeToSample: Record<string, string> = {};

    for (const file of files) {
      const idx = file.indexOf('_chapter_');
      if (idx > 0) {
        const code = file.substring(0, idx);
        if (!codeToSample[code] || file.includes('_chapter_1.json')) {
          codeToSample[code] = path.join(dirPath, file);
        }
      }
    }

    const results: { code: string; name: string }[] = [];
    for (const [code, samplePath] of Object.entries(codeToSample)) {
      try {
        const raw = fs.readFileSync(samplePath, 'utf8');
        const json = JSON.parse(raw);
        const name = json.book_name || code;
        results.push({ code, name });
      } catch {
        results.push({ code, name: code });
      }
    }

    // Sort by name
    results.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to list books' }, { status: 500 });
  }
}


