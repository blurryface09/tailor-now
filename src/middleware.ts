import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LEGACY_HOST = 'tailornow.vercel.app'
const CANONICAL_HOST = 'tailornow.shop'

export function middleware(req: NextRequest) {
  if (req.headers.get('host') === LEGACY_HOST) {
    const url = new URL(req.url)
    url.protocol = 'https'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
