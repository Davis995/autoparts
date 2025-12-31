'use client'

import { supabase } from './supabase'

/**
 * Upload images to Supabase Storage
 * @param files - Array of File objects to upload
 * @param folder - Folder path in storage bucket (default: 'products')
 * @returns Array of public URLs for uploaded images
 */
export async function uploadImages(
  files: File[],
  folder: string = 'products'
): Promise<string[]> {
  if (files.length === 0) return []

  const uploadPromises = files.map(async (file) => {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading image:', error)
      throw error
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath)

    return publicUrl
  })

  return Promise.all(uploadPromises)
}

/**
 * Delete images from Supabase Storage
 * @param urls - Array of image URLs to delete
 */
export async function deleteImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return

  const deletePromises = urls.map(async (url) => {
    // Extract file path from URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.findIndex((part) => part === 'product-images')
    
    if (bucketIndex === -1) {
      console.warn('Could not extract path from URL:', url)
      return
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      // Don't throw - continue deleting other images
    }
  })

  await Promise.all(deletePromises)
}



