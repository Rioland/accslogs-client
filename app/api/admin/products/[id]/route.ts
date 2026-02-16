/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// GET: Get specific product with configurations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        category:socialmedia_account_category(name),
        subcategory:socialmedia_account_subcategory(name)
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get configurations
    const { data: configurations, error: configError } = await supabaseAdmin
      .from('product_configurations')
      .select('*')
      .eq('product_id', productId)
      .order('config_index');

    if (configError) {
      console.error('Error fetching configurations:', configError);
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 });
    }

    return NextResponse.json({ product, configurations });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { name, price, quantity, description, category_id, subcategory_id, configurations } = await request.json();

    // Update product
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (subcategory_id !== undefined) updateData.subcategory_id = subcategory_id;

    if (Object.keys(updateData).length > 0) {
      const { error: productError } = await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (productError) {
        console.error('Error updating product:', productError);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
      }
    }

    // Handle configurations if quantity > 0
    if (quantity > 0 && configurations && Array.isArray(configurations)) {
      // Delete existing configurations
      await supabaseAdmin
        .from('product_configurations')
        .delete()
        .eq('product_id', productId);

      // Insert new configurations
      const configInserts = configurations.map((config: Record<string, any>, index: number) => ({
        product_id: productId,
        config_index: index + 1,
        config_data: config,
      }));

      const { error: configError } = await supabaseAdmin
        .from('product_configurations')
        .insert(configInserts);

      if (configError) {
        console.error('Error updating configurations:', configError);
        return NextResponse.json({ error: 'Failed to update configurations' }, { status: 500 });
      }
    } else if (quantity === 0) {
      // Delete configurations if quantity is 0
      await supabaseAdmin
        .from('product_configurations')
        .delete()
        .eq('product_id', productId);
    }

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Delete product (configurations will be deleted due to cascade)
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
