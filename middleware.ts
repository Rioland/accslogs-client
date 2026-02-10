import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight middleware check for Supabase auth cookie presence.
// It looks for the sb-*-auth-token cookie that Supabase sets in the browser.
// If not present or invalid, redirect to /login.
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl

  // Find a supabase auth cookie
  const supabaseCookie = req.cookies
    .getAll()
    .find((c) => c.name.includes('sb-') && c.name.endsWith('-auth-token'))

  const isAuthed = !!supabaseCookie

  if (!isAuthed) {
    const url = new URL('/login', origin)
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Apply to all dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
}
