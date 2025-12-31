import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, firstName, lastName } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  const supabase = createServerComponentClient()

  try {
    // Prefer service-role admin create if available so email is confirmed immediately
    const adminCreate = (supabase as any).auth?.admin?.createUser
    let createdUserId: string | null = null
    let createdEmail: string | null = null

    if (typeof adminCreate === 'function') {
      const { data, error } = await (supabase as any).auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      })

      if (!error && data.user) {
        createdUserId = data.user.id
        createdEmail = data.user.email
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
      createdEmail = signUpData.user?.email ?? null
    }

    if (!createdUserId || !createdEmail) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // Create or update admin profile
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .upsert(
        [
          {
            id: createdUserId,
            email: createdEmail,
            firstName: firstName || null,
            lastName: lastName || null,
            isAdmin: true,
            emailVerified: true,
            role: 'ADMIN',
          },
        ],
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('Admin register profile upsert error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create admin profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      userId: createdUserId,
      email: createdEmail,
    })
  } catch (error) {
    console.error('Admin register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
