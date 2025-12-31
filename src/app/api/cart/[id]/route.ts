import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT update cart item quantity
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { quantity } = await request.json();
    const cartItemId = id;

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Get cart item with product to check stock and verify ownership
    const { data: cartItem, error: fetchError } = await (supabase as any)
      .from('cart_items')
      .select(`
        *,
        cart:cart!inner(userId),
        product:products(*)
      `)
      .eq('id', cartItemId)
      .eq('cart.userId', user.id)
      .single();

    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (!Array.isArray(cartItem.product) && 
    typeof cartItem.product === 'object' && 
    cartItem.product !== null && 
    'stock' in cartItem.product && 
    typeof (cartItem.product as any).stock === 'number' && 
    (cartItem.product as any).stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Update quantity
    const { data: updatedItem, error: updateError } = await (supabase as any)
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
    }

    return NextResponse.json({ cartItem: updatedItem });
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE remove item from cart
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const cartItemId = id;

    // Verify ownership before deletion
    const { data: cartItem, error: fetchError } = await (supabase as any)
      .from('cart_items')
      .select(`
        *,
        cart:cart!inner(userId)
      `)
      .eq('id', cartItemId)
      .eq('cart.userId', user.id)
      .single();

    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    const { error: deleteError } = await (supabase as any)
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
