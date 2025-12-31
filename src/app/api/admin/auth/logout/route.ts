import { createServerComponentClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerComponentClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
