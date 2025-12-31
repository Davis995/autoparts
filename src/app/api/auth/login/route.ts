import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  const supabase = createServerComponentClient()

  try {
    // 1. Authenticate user
    const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (!user || !session) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // 2. Check if user profile exists, create if not
    console.log('Checking profile for user:', user.id)
    const { data: existingProfile, error: profileCheckError } = await (supabase as any)
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    console.log('Profile check result:', { existingProfile, profileCheckError })

    if (!existingProfile) {
      console.log('Creating new profile for user:', user.id)
      // Create profile for existing user who doesn't have one
      const { error: profileError } = await (supabase as any)
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          firstName: user.user_metadata?.first_name || null,
          lastName: user.user_metadata?.last_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
          isAdmin: false,
          emailVerified: user.email_confirmed_at ? true : false,
          role: 'USER'
        })

      console.log('Profile creation result:', { profileError })

      if (profileError) {
        console.error('Error creating user profile during login:', profileError)
        // Don't fail the login, just log the error
      }
    } else {
      console.log('Profile already exists for user:', user.id)
    }

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
