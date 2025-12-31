import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Do not enforce server-side admin checks for /admin pages.
  // Client-side AdminAuth handles admin protection.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  
  // Protect admin API routes (but allow open admin login + registration)
  if (
    pathname.startsWith('/api/admin/') &&
    !pathname.startsWith('/api/admin/auth/login') &&
    !pathname.startsWith('/api/admin/auth/register')
  ) {
    const supabase = createServerComponentClient()
    
    // Get auth token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify token and check admin status
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: profile } = await (supabase as any)
      .from('user_profiles')
      .select('isAdmin')
      .eq('id', user.id)
      .single()
    
    // Handle case where is_admin column doesn't exist yet
    const isAdmin = profile?.isAdmin ?? false
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
