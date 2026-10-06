import { NextResponse } from 'next/server'
import { getCMS } from '@/lib/content'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getCMS()
    await payload.count({ collection: 'pages', overrideAccess: true })
    return NextResponse.json({ status: 'ok' }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
