import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/favorites/check/[id] - check if a product is favorited by current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ isFavorited: false })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ isFavorited: false })
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('userId', user.id)
      .eq('productId', id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite:', error)
    }

    return NextResponse.json({ isFavorited: !!data })
  } catch (error) {
    console.error('Favorites check error:', error)
    return NextResponse.json({ isFavorited: false })
  }
}
