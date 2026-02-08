import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight middleware check for Supabase auth cookie presence.
// It looks for the sb-*-auth-token cookie that Supabase sets in the browser.
// If not present or invalid, redirect to /login.
export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl

  // Find a supabase auth cookie and try to detect a session
  const supabaseCookie = req.cookies
    .getAll()
    .find((c) => c.name.includes('sb-') && c.name.endsWith('-auth-token'))

  let isAuthed = false
  if (supabaseCookie) {
    try {
      const parsed = JSON.parse(supabaseCookie.value)
      // Supabase stores { currentSession, expiresAt } in this cookie
      if (parsed?.currentSession?.user?.id) {
        isAuthed = true
      }
    } catch (_) {
      // Ignore parse errors; treat as unauthenticated
    }
  }

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
