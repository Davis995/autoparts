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
    // 1. Create user in Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email!,
        firstName: firstName || null,
        lastName: lastName || null,
        isAdmin: false,
        emailVerified: false
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Don't fail the signup if profile creation fails
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
