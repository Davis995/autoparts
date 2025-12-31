import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerComponentClient()
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching promotions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch promotions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(promotions || [])
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerComponentClient()

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating promotion:', error)
      return NextResponse.json(
        { error: 'Failed to create promotion' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    console.error('Error creating promotion:', error)
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    )
  }
}
