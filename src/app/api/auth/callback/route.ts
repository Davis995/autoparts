import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerComponentClient()

    // Exchange auth code for session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
            lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            isAdmin: false, // Default to non-admin
            emailVerified: user.email_confirmed_at ? true : false,
            role: 'USER'
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't fail the auth flow, just log the error
        }
      } else {
        // Update existing profile with latest auth metadata
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            emailVerified: user.email_confirmed_at ? true : false,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
            firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || undefined,
            lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || undefined,
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
