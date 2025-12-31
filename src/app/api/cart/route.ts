import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET user's cart items
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // First get or create user's cart
    let { data: cart, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('userId', user.id)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // Cart doesn't exist, create one
      const { data: newCart, error: createError } = await supabase
        .from('cart')
        .insert({ userId: user.id })
        .select()
        .single();

      if (createError) {
        console.error('Error creating cart:', createError);
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }
      cart = newCart;
    } else if (cartError) {
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    // Fetch cart items with product details
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('cartId', cart.id)
      .eq('product.isActive', true);

    if (error) {
      console.error('Error fetching cart items:', error);
      return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
    }

    return NextResponse.json({ cartItems });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST add item to cart
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId || quantity < 1) {
      return NextResponse.json({ error: 'Invalid product ID or quantity' }, { status: 400 });
    }

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('isActive', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Get or create user's cart
    let { data: cart, error: cartError } = await supabase
      .from('cart')
      .select('id')
      .eq('userId', user.id)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // Cart doesn't exist, create one
      const { data: newCart, error: createError } = await supabase
        .from('cart')
        .insert({ userId: user.id })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }
      cart = newCart;
    } else if (cartError) {
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    // Check if item already in cart
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cartId', cart.id)
      .eq('productId', productId)
      .single();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
      }

      return NextResponse.json({ cartItem: updatedItem });
    } else {
      // Add new item
      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cartId: cart.id,
          productId: productId,
          quantity,
          price: product.price
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
      }

      return NextResponse.json({ cartItem: newItem });
    }
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
