import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerComponentClient()
    const { data: order, error } = await (supabase as any)
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('id', id)
      .single()
    
    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    const orderWithDetails = {
      id: (order as any).id,
      orderNumber: (order as any).order_number,
      userId: (order as any).user_id,
      email: (order as any).email,
      phone: (order as any).phone,
      locationName: (order as any).location_name,
      latitude: (order as any).latitude,
      longitude: (order as any).longitude,
      distanceKm: (order as any).distance_km,
      transportFee: Number((order as any).transport_fee ?? 0),
      serviceFee: Number((order as any).service_fee ?? 0),
      totalAmount: Number((order as any).total_amount ?? (order as any).total ?? 0),
      paymentMethod: (order as any).payment_method,
      status: (order as any).status,
      // legacy
      total: Number((order as any).total ?? (order as any).total_amount ?? 0),
      address: (order as any).address,
      createdAt: (order as any).created_at,
      updatedAt: (order as any).updated_at,
      user: null,
      orderItems: ((order as any).items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product
      }))
    }
    
    return NextResponse.json(orderWithDetails)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Transform camelCase to snake_case for Supabase (partial update)
    const transformedData: Record<string, any> = {}

    if (body.orderNumber !== undefined) transformedData.order_number = body.orderNumber
    if (body.userId !== undefined) transformedData.user_id = body.userId
    if (body.email !== undefined) transformedData.email = body.email
    if (body.phone !== undefined) transformedData.phone = body.phone
    if (body.locationName !== undefined) transformedData.location_name = body.locationName
    if (body.latitude !== undefined) transformedData.latitude = body.latitude
    if (body.longitude !== undefined) transformedData.longitude = body.longitude
    if (body.distanceKm !== undefined) transformedData.distance_km = body.distanceKm
    if (body.transportFee !== undefined) transformedData.transport_fee = body.transportFee
    if (body.serviceFee !== undefined) transformedData.service_fee = body.serviceFee
    if (body.totalAmount !== undefined) transformedData.total_amount = body.totalAmount
    if (body.paymentMethod !== undefined) transformedData.payment_method = body.paymentMethod
    if (body.status !== undefined) transformedData.status = body.status

    // legacy fields kept in sync when provided
    if (body.totalAmount !== undefined || body.total !== undefined) {
      transformedData.total = body.totalAmount ?? body.total
    }
    if (body.address !== undefined || body.locationName !== undefined) {
      transformedData.address = body.address ?? body.locationName
    }
    
    const supabase = createServerComponentClient()
    const { data: order, error } = await (supabase as any)
      .from('orders')
      .update(transformedData)
      .eq('id', id)
      .select('*, items:order_items(*, product:products(*))')
      .single()
		
    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found or update failed' },
        { status: 404 }
      )
    }
		
    const orderWithDetails = {
      id: (order as any).id,
      orderNumber: (order as any).order_number,
      userId: (order as any).user_id,
      email: (order as any).email,
      phone: (order as any).phone,
      locationName: (order as any).location_name,
      latitude: (order as any).latitude,
      longitude: (order as any).longitude,
      distanceKm: (order as any).distance_km,
      transportFee: Number((order as any).transport_fee ?? 0),
      serviceFee: Number((order as any).service_fee ?? 0),
      totalAmount: Number((order as any).total_amount ?? (order as any).total ?? 0),
      paymentMethod: (order as any).payment_method,
      status: (order as any).status,
      // legacy
      total: Number((order as any).total ?? (order as any).total_amount ?? 0),
      address: (order as any).address,
      createdAt: (order as any).created_at,
      updatedAt: (order as any).updated_at,
      user: null,
      orderItems: ((order as any).items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product
      }))
    }
    
    return NextResponse.json(orderWithDetails)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
