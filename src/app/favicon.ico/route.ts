import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = false

function resolvePaths(): string[] {
  const cwd = process.cwd()
  return [
    join(cwd, 'public', 'favicon.ico'),
    join(cwd, '.next', 'standalone', 'public', 'favicon.ico'),
  ]
}

export async function GET() {
  const paths = resolvePaths()
  for (const p of paths) {
    try {
      const buf = await readFile(p)
      return new Response(buf, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch {}
  }
  return new Response('Not Found', { status: 404 })
}

