import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const userOnly = request.nextUrl.searchParams.get('scope') === 'me'
    let userId: string | null = null

    if (userOnly) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const token = authHeader.split(' ')[1]
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token)

      if (authError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      userId = user.id
    }

    let query = supabase
      .from('orders')
      .select('*, user:users(*), items:order_items(*, product:products(*))')
      .order('created_at', { ascending: false })

    if (userOnly && userId) {
      query = query.eq('user_id', userId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }
    
    const ordersWithDetails = (orders || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      email: order.email,
      phone: order.phone,
      locationName: order.location_name,
      latitude: order.latitude,
      longitude: order.longitude,
      distanceKm: order.distance_km,
      transportFee: Number(order.transport_fee ?? 0),
      serviceFee: Number(order.service_fee ?? 0),
      totalAmount: Number(order.total_amount ?? order.total ?? 0),
      paymentMethod: order.payment_method,
      status: order.status,
      // legacy fields kept for components that still expect them
      total: Number(order.total ?? order.total_amount ?? 0),
      address: order.address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      user: order.user,
      orderItems: (order.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product,
      })),
    }))
    
    return NextResponse.json(ordersWithDetails)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Expect camelCase from callers and convert to snake_case for Supabase
    const transformed = {
      order_number: body.orderNumber,
      user_id: body.userId,
      email: body.email,
      phone: body.phone,
      location_name: body.locationName,
      latitude: body.latitude,
      longitude: body.longitude,
      distance_km: body.distanceKm,
      transport_fee: body.transportFee,
      service_fee: body.serviceFee,
      total_amount: body.totalAmount,
      payment_method: body.paymentMethod,
      status: body.status,
      // legacy fields
      total: body.totalAmount ?? body.total,
      address: body.address ?? body.locationName,
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert(transformed)
      .select('*, user:users(*), items:order_items(*, product:products(*))')
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    const mapped = {
      id: (order as any).id,
      orderNumber: (order as any).order_number,
      userId: (order as any).user_id,
      email: (order as any).email,
      status: (order as any).status,
      total: Number((order as any).total),
      address: (order as any).address,
      createdAt: (order as any).created_at,
      updatedAt: (order as any).updated_at,
      user: (order as any).user,
      orderItems: ((order as any).items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product,
      })),
    }

    return NextResponse.json(mapped, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
