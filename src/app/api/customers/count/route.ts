import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching customers count:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers count' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error fetching customers count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers count' },
      { status: 500 }
    )
  }
}
