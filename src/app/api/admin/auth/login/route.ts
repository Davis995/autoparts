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

    // 2. Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('isAdmin, role, email, firstName, lastName')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.isAdmin) {
      // Sign out the user since they're not admin
      await supabase.auth.signOut()
      
      return NextResponse.json(
        { error: 'Admin access required. You do not have permission to access the admin panel.' },
        { status: 403 }
      )
    }

    // 3. Create profile if it doesn't exist (for existing users)
    if (!profile) {
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          firstName: user.user_metadata?.first_name || null,
          lastName: user.user_metadata?.last_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
          isAdmin: false, // Will be updated separately for actual admins
          emailVerified: user.email_confirmed_at ? true : false,
          role: 'CUSTOMER'
        })

      if (createProfileError) {
        console.error('Error creating user profile:', createProfileError)
        // Don't fail the login completely, but log the error
      }

      // If we just created a profile, they're not admin yet
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Admin access required. Your account has been created but admin access is not granted.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Admin login successful',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        profile: {
          isAdmin: profile.isAdmin,
          role: profile.role,
          firstName: profile.firstName,
          lastName: profile.lastName
        }
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
