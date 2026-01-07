'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatarUrl: string | null
  role: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

interface Product {
  id: string
  name: string
  price: number
  slug: string
  description: string | null
  shortDescription: string | null
  comparePrice: number | null
  brand: string | null
  images: string[]
  isBestSelling: boolean
  createdAt: Date
  updatedAt: Date
}

interface OrderItemWithProduct {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: Product
}

interface Order {
  id: string
  orderNumber: string
  userId: string | null
  email: string
  phone?: string | null
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  distanceKm?: number | null
  transportFee?: number
  serviceFee?: number
  totalAmount?: number
  paymentMethod?: string
  status: string
  total: number
  address: string
  createdAt: Date
  updatedAt: Date
}

type OrderUpdate = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>

export interface OrderWithDetails {
  id: string
  orderNumber: string
  userId: string | null
  email: string
  phone?: string | null
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  distanceKm?: number | null
  transportFee?: number
  serviceFee?: number
  totalAmount?: number
  paymentMethod?: string
  status: string
  total: number
  address: string
  createdAt: Date
  updatedAt: Date
  user: UserProfile | null
  orderItems?: OrderItemWithProduct[]
}

interface OrderItemWithProduct {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: Product
}

interface UseOrdersOptions {
  scope?: 'all' | 'me'
  /**
   * Optional refetch interval in milliseconds for polling orders.
   * When provided, React Query will automatically refetch at this interval
   * while the window is focused.
   */
  refetchIntervalMs?: number
}

export function useOrders(options?: UseOrdersOptions) {
  const queryClient = useQueryClient()

  // Optional Supabase realtime subscription so admin/users get live updates
  useEffect(() => {
    if (!options?.refetchIntervalMs && !options?.scope) {
      // no special options provided; still allow realtime when explicitly enabled later
    }
  }, [options?.refetchIntervalMs, options?.scope])

  // Subscribe to order INSERT/UPDATE events when requested
  useEffect(() => {
    // We enable realtime only when explicitly asked via enableRealtime flag
    // to avoid unnecessary websocket usage for all views.
    // @ts-expect-error - allow extra option without changing public type too much
    const enableRealtime: boolean | undefined = options?.enableRealtime
    if (!enableRealtime) return
    if (typeof window === 'undefined') return

    const channel = supabaseClient
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const oldStatus = (payload as any).old?.status
        const newStatus = (payload as any).new?.status
        if (oldStatus !== newStatus) {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
      })
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [queryClient, options])

  return useQuery({
    queryKey: ['orders', options?.scope ?? 'all'],
    queryFn: async (): Promise<OrderWithDetails[]> => {
      try {
        const scope = options?.scope ?? 'all'
        const url = scope === 'me' ? '/api/orders?scope=me' : '/api/orders'

        const headers: HeadersInit = {}
        if (scope === 'me' && typeof window !== 'undefined') {
          const sessionData = localStorage.getItem('auth_session')
          if (sessionData) {
            const token = JSON.parse(sessionData).token
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }
          }
        }

        const response = await fetch(url, { headers })
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in useOrders:', err)
        throw new Error(`Failed to fetch orders: ${err.message}`)
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: options?.refetchIntervalMs,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<OrderWithDetails | null> => {
      if (!id) return null
      
      try {
        const response = await fetch(`/api/orders/${id}`)
        if (!response.ok) {
          if (response.status === 404) return null
          throw new Error('Failed to fetch order')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in useOrder:', err)
        throw new Error(`Failed to fetch order: ${err.message}`)
      }
    },
    enabled: !!id,
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: OrderUpdate & { id: string }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update order')
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (typeof window !== 'undefined') {
        const sessionData = localStorage.getItem('auth_session')
        if (!sessionData) {
          throw new Error('You must be logged in to cancel an order')
        }
        const token = JSON.parse(sessionData).token
        if (!token) {
          throw new Error('You must be logged in to cancel an order')
        }
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/orders/${id}/cancel`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error ?? 'Failed to cancel order')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', (variables as any).id] })
    },
  })
}

