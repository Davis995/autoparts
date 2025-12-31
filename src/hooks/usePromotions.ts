'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database'

type Promotion = Database['public']['Tables']['promotions']['Row']
type PromotionInsert = Database['public']['Tables']['promotions']['Insert']
type PromotionUpdate = Database['public']['Tables']['promotions']['Update']

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async (): Promise<Promotion[]> => {
      try {
        const response = await fetch('/api/promotions')
        if (!response.ok) {
          throw new Error('Failed to fetch promotions')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in usePromotions:', err)
        throw new Error(`Failed to fetch promotions: ${err.message}`)
      }
    },
    retry: 2,
    retryDelay: 1000,
  })
}

export function usePromotion(id: string) {
  return useQuery({
    queryKey: ['promotion', id],
    queryFn: async (): Promise<Promotion | null> => {
      if (!id) return null
      
      try {
        const response = await fetch(`/api/promotions/${id}`)
        if (!response.ok) {
          if (response.status === 404) return null
          throw new Error('Failed to fetch promotion')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in usePromotion:', err)
        throw new Error(`Failed to fetch promotion: ${err.message}`)
      }
    },
    enabled: !!id,
  })
}

export function useCreatePromotion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (promotion: PromotionInsert) => {
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotion),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create promotion')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    },
  })
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: PromotionUpdate & { id: string }) => {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update promotion')
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      queryClient.invalidateQueries({ queryKey: ['promotion', variables.id] })
    },
  })
}

export function useDeletePromotion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete promotion')
      }
      
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    },
  })
}



