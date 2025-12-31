import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

// Demo admin defaults
const DEMO_EMAIL = 'admin@autohubgarage.com'
const DEMO_PASSWORD = 'Admin123!'
const DEMO_FIRST = 'AutoHub'
const DEMO_LAST = 'Admin'

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient()

  // Optional body overrides
  let email = DEMO_EMAIL
  let password = DEMO_PASSWORD
  let firstName = DEMO_FIRST
  let lastName = DEMO_LAST

  try {
    const body = await req.json().catch(() => null)
    if (body) {
      email = body.email ?? email
      password = body.password ?? password
      firstName = body.firstName ?? firstName
      lastName = body.lastName ?? lastName
    }
  } catch {}

  try {
    // Try service-role admin create for immediate confirmation
    const adminCreate = (supabase as any).auth?.admin?.createUser
    let createdUserId: string | null = null

    if (typeof adminCreate === 'function') {
      const { data, error } = await (supabase as any).auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
      })
      if (error) {
        // Fall back to public sign up
          console.warn('Admin createUser failed, falling back to signUp:', error?.message)
      } else {
        createdUserId = data.user?.id ?? null
      }
    }

    // Fallback: public signUp (may require email confirmation depending on settings)
    if (!createdUserId) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      })
      if (signUpError) {
        return NextResponse.json({ error: signUpError.message }, { status: 400 })
      }
      createdUserId = signUpData.user?.id ?? null
    }

    if (!createdUserId) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // Upsert admin profile
    const profilePayload: import('@/types/database').Database['public']['Tables']['user_profiles']['Insert'] = {
      id: createdUserId,
      email,
      firstName,
      lastName,
      isAdmin: true,
      emailVerified: true,
      role: 'ADMIN',
    }

    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .upsert([profilePayload], { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
    }

    return NextResponse.json({
      message: 'Demo admin seeded',
      credentials: { email, password },
      userId: createdUserId,
      note: 'If email confirmation is required, verify the email or set service role key in env for immediate confirmation.'
    })
  } catch (err: any) {
    console.error('Seed admin error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
