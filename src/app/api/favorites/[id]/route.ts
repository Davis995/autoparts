import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/favorites/[id] - add product to favorites
// DELETE /api/favorites/[id] - remove product from favorites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Optionally verify product exists and is active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, isActive')
      .eq('id', id)
      .single()

    if (productError || !product || !product.isActive) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('favorites')
      .upsert(
        { userId: user.id, productId: id },
        { onConflict: 'userId,productId' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error adding favorite:', error)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Favorites POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('userId', user.id)
      .eq('productId', id)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorites DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
