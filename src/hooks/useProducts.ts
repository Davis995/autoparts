'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: number
  comparePrice: number | null
  costPrice: number | null
  sku: string | null
  barcode: string | null
  trackInventory: boolean
  stockQuantity: number
  lowStockThreshold: number
  weight: number | null
  dimensions: any
  categoryId: string | null
  brand: string | null
  tags: string[]
  images: string[]
  isActive: boolean
  isFeatured: boolean
  isBestSelling: boolean
  isTopSelling?: boolean
  newArrival: boolean
  onSale: boolean
  rating: number
  reviewCount: number
  soldCount: number
  createdAt: Date
  updatedAt: Date
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// Payloads used by the admin UI for create/update.
// These represent the fields we actually send to the API,
// which may be a subset of the full Product shape.
export type ProductInsert = {
  name: string
  description: string | null
  price: number
  stock: number
  categoryId: string
  images: string[]
  isActive: boolean
  isBestSelling: boolean
  isTopSelling: boolean
}

export type ProductUpdate = Partial<ProductInsert>

export interface ProductWithCategory extends Product {
  category: Category | null
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<ProductWithCategory[]> => {
      try {
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in useProducts:', err)
        throw new Error(`Failed to fetch products: ${err.message}`)
      }
    },
    retry: 2,
    retryDelay: 1000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<ProductWithCategory | null> => {
      if (!id) return null
      
      try {
        const response = await fetch(`/api/products/${id}`)
        if (!response.ok) {
          if (response.status === 404) return null
          throw new Error('Failed to fetch product')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in useProduct:', err)
        throw new Error(`Failed to fetch product: ${err.message}`)
      }
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create product')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update product')
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete product')
      }
      
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
