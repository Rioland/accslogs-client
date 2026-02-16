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

// GET: List all products with category and subcategory names
export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        category:socialmedia_account_category(name),
        subcategory:socialmedia_account_subcategory(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
  try {
    const { name, price, quantity, description, category_id, subcategory_id, configurations } = await request.json();

    if (!name || price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Name, price, and quantity are required' }, { status: 400 });
    }

    // Insert product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        price,
        quantity,
        description,
        category_id,
        subcategory_id,
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    // If quantity > 0 and configurations provided, insert configurations
    if (quantity > 0 && configurations && Array.isArray(configurations)) {
      const configInserts = configurations.map((config: Record<string, any>, index: number) => ({
        product_id: product.id,
        config_index: index + 1,
        config_data: config,
      }));

      const { error: configError } = await supabaseAdmin
        .from('product_configurations')
        .insert(configInserts);

      if (configError) {
        console.error('Error creating configurations:', configError);
        // Delete the product if configs fail
        await supabaseAdmin.from('products').delete().eq('id', product.id);
        return NextResponse.json({ error: 'Failed to create product configurations' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
