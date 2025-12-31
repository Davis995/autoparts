import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/favorites - list current user's favorites with product+category details
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id, "createdAt", product:products(*, category:categories(*))')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    // Ensure createdAt is exposed as camelCase for frontend
    const favorites = (data || []).map((item: any) => ({
      id: item.id,
      createdAt: item.createdAt ?? item.created_at ?? item["createdAt"],
      product: item.product,
    }))

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
