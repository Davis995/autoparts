'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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

type CategoryInsert = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
type CategoryUpdate = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>

export interface CategoryWithProductCount extends Category {
  productCount?: number
}

function getAuthToken() {
  if (typeof window === 'undefined') return null
  const sessionData = localStorage.getItem('auth_session')
  if (!sessionData) return null
  try {
    return JSON.parse(sessionData).token as string | undefined
  } catch {
    return null
  }
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<CategoryWithProductCount[]> => {
      try {
        const token = getAuthToken()
        const response = await fetch('/api/categories', {
          headers: token
            ? { 'Authorization': `Bearer ${token}` }
            : {},
        })
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in useCategories:', err)
        throw new Error(`Failed to fetch categories: ${err.message}`)
      }
    },
    retry: 2,
    retryDelay: 1000,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async (): Promise<Category | null> => {
      if (!id) return null
      
      try {
        const response = await fetch(`/api/categories/${id}`)
        if (!response.ok) {
          if (response.status === 404) return null
          throw new Error('Failed to fetch category')
        }
        return response.json()
      } catch (err: any) {
        console.error('Error in useCategory:', err)
        throw new Error(`Failed to fetch category: ${err.message}`)
      }
    },
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(category),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create category')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update category')
      }
      
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete category')
      }
      
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

