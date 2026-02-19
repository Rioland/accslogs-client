import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader || '',
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { productData, accounts } = await request.json();

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('seller_products')
      .insert({
        user_id: user.id,
        name: productData.name,
        category: productData.category,
        subcategory: productData.subcategory,
        description: productData.description,
        price: parseFloat(productData.price),
        release_option: productData.releaseOption,
        status: 'pending',
      })
      .select()
      .single();

    if (productError) {
      console.error('Product insert error:', productError);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    // Insert accounts
    const accountsToInsert = accounts.map((acc: { username: string; password: string; email?: string; emailPassword?: string; additionalInfo?: string; previewLink?: string }) => ({
      product_id: product.id,
      username: acc.username,
      password: acc.password,
      email: acc.email,
      email_password: acc.emailPassword,
      additional_info: acc.additionalInfo,
      preview_link: acc.previewLink,
    }));

    const { error: accountsError } = await supabase
      .from('seller_product_accounts')
      .insert(accountsToInsert);

    if (accountsError) {
      console.error('Accounts insert error:', accountsError);
      return NextResponse.json({ error: 'Failed to create accounts' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all seller accounts (assuming admin panel)
    const { data: accounts, error: accountsError } = await supabase
      .from('seller_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (accountsError) {
      console.error('Accounts fetch error:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { id, status } = await request.json();

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status
    const { error: updateError } = await supabase
      .from('seller_products')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Status updated' }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { id } = await request.json();

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete product (accounts will cascade)
    const { error: deleteError } = await supabase
      .from('seller_products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
