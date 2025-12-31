import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerComponentClient()
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Transform to camelCase for frontend
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
    
    return NextResponse.json(responseCategory)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
    const supabase = createServerComponentClient()

    // Build partial update object: only include fields that are provided
    const transformedData: Record<string, any> = {}

    if (body.name !== undefined) transformedData.name = body.name
    if (body.slug !== undefined)
      transformedData.slug =
        body.slug || (body.name ? body.name.toLowerCase().replace(/\s+/g, '-') : undefined)
    if (body.description !== undefined)
      transformedData.description = body.description
    if (body.imageUrl !== undefined)
      transformedData.image_url = body.imageUrl
    if (body.isActive !== undefined)
      transformedData.is_active = body.isActive
    if (body.sortOrder !== undefined)
      transformedData.sort_order = body.sortOrder

    const { data: category, error } = await supabase
      .from('categories')
      .update(transformedData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json(
        { error: 'Failed to update category', details: error.message },
        { status: 500 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
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
      
      return NextResponse.json(responseCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerComponentClient()
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
