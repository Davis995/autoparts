import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple checkout endpoint: creates an order from the current user's cart
// without shipping calculations, then clears the cart.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      phone,
      locationName,
      items,
    } = await request.json().catch(() => ({
      phone: null,
      locationName: null,
      items: [],
    }));

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Load products for all items from the database
    const productIds = [...new Set(items.map((i: any) => i.productId))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('isActive', true);

    if (productsError) {
      console.error('Error fetching products during checkout:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products for cart items' }, { status: 500 });
    }

    const productMap = new Map<string, any>();
    for (const p of (products || []) as any[]) {
      productMap.set(p.id as string, p);
    }

    // Validate stock and compute products subtotal using authoritative DB price
    let productsTotal = 0;
    for (const item of items as any[]) {
      const product = productMap.get(item.productId);
      if (!product || typeof product.stock !== 'number') {
        return NextResponse.json({ error: 'Invalid product in cart' }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: 'Insufficient stock for one or more items' }, { status: 400 });
      }
      productsTotal += Number(product.price) * item.quantity;
    }

    // ---------------------------------------------------------------------
    // Simple checkout: no Google distance, just phone + location
    // ---------------------------------------------------------------------

    // Basic guard: require phone and a location name
    if (!phone || !locationName) {
      return NextResponse.json({ error: 'Phone number and delivery location are required' }, { status: 400 });
    }

    // No Google distance or dynamic transport fee: keep simple
    const distanceKm = 0;
    const transportFee = 0;
    const serviceFee = 0;
    const totalAmount = productsTotal;

    const now = new Date().toISOString();
    const orderNumber = `ORD-${Date.now()}`;

    // Create order row
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        email: user.email,
        phone,
        location_name: locationName,
        latitude: null,
        longitude: null,
        distance_km: distanceKm,
        transport_fee: transportFee,
        service_fee: serviceFee,
        total_amount: totalAmount,
        payment_method: 'COD',
        status: 'CASH_ON_DELIVERY',
        // keep legacy fields in sync for existing UI
        total: totalAmount,
        address: locationName,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const orderId = (order as any).id;

    // Create order_items
    const orderItemsPayload = (items as any[]).map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      // Use the authoritative DB price we fetched earlier
      price: Number(productMap.get(item.productId)?.price ?? 0),
      created_at: now,
      updated_at: now,
    }));

    const { error: orderItemsError } = await (supabase as any)
      .from('order_items')
      .insert(orderItemsPayload);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Decrease product stock
    for (const item of items as any[]) {
      const product = productMap.get(item.productId) as any;
      const newStock = product.stock - item.quantity;
      const { error: stockError } = await (supabase as any)
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (stockError) {
        console.error('Error updating product stock:', stockError);
      }
    }

    return NextResponse.json({
      orderId,
      orderNumber,
      productsTotal,
      transportFee,
      serviceFee,
      totalAmount,
      paymentMethod: 'COD',
      status: 'CASH_ON_DELIVERY',
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
