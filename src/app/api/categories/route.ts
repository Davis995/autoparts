import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerComponentClient()
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }
    
    // Transform snake_case to camelCase for frontend
    const categoriesWithCount = (categories || []).map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      productCount: category.products?.length || 0
    }))
    
    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerComponentClient()
    
    // Transform camelCase to snake_case for Supabase
    const transformedData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || null,
      image_url: body.imageUrl || null,
      is_active: body.isActive !== false, // default to true
      sort_order: body.sortOrder || 0
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert(transformedData)
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { error: 'Failed to create category', details: error.message },
        { status: 500 }
      )
    }
    
    // Transform back to camelCase for frontend
    const responseCategory = {
      id: (category as any).id,
      name: (category as any).name,
      slug: (category as any).slug,
      description: (category as any).description,
      imageUrl: (category as any).image_url,
      isActive: (category as any).is_active,
      sortOrder: (category as any).sort_order,
      createdAt: (category as any).created_at,
      updatedAt: (category as any).updated_at
    }
    
    return NextResponse.json(responseCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
