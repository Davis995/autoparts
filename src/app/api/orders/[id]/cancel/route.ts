import { NextRequest, NextResponse } from 'next/server'
import { supabase, createServerComponentClient } from '@/lib/supabase'

// Allow authenticated customers to cancel their own orders
// when the order is still early in the lifecycle.
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const serverSupabase = createServerComponentClient()

    // Load the order to check ownership and status
    const { data: order, error: orderError } = await (serverSupabase as any)
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if ((order as any).user_id !== user.id) {
      return NextResponse.json({ error: 'You can only cancel your own orders' }, { status: 403 })
    }

    const currentStatus = (order as any).status as string
    const cancellableStatuses = ['PENDING', 'CASH_ON_DELIVERY']

    if (!cancellableStatuses.includes(currentStatus)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await (serverSupabase as any)
      .from('orders')
      .update({ status: 'CANCELLED' })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updated) {
      console.error('Error cancelling order:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: (updated as any).id,
      status: (updated as any).status,
      cancelledAt: (updated as any).updated_at,
    })
  } catch (error) {
    console.error('Error in cancel order endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
