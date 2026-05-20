import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/planner', '/meals', '/grocery', '/settings', '/onboarding']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = request.cookies.get('session_id')?.value

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(`${p}/`))
  if (!isProtected) return NextResponse.next()

  if (!sessionId) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  const response = NextResponse.next()
  response.headers.set('x-session-id', sessionId)
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/planner/:path*',
    '/meals/:path*',
    '/grocery/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
  ],
}
