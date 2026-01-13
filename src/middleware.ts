// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes ที่ไม่ต้อง auth
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/register', '/api/settings/system']

// Routes ที่ต้องเป็น admin
const adminRoutes = ['/users', '/api/users']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  // Allow static files (videos, images, etc.)
  if (pathname.startsWith('/videos') || pathname.startsWith('/images')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)))) {
    // If already logged in and trying to access login page, redirect to dashboard
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Allow static files and API routes except protected ones
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: 'ไม่ได้เข้าสู่ระบบ' },
        { status: 401 }
      )
    }
    // Page routes redirect to home (landing page)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}