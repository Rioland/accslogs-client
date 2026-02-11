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

// GET: Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking admin status:', adminError);
      return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
    }

    const user = {
      ...profile,
      is_admin: !!adminData,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { email, first_name, last_name, funds, is_admin } = await request.json();

    // Update profile
    const updateData: {
      email?: string;
      first_name?: string;
      last_name?: string;
      funds?: number;
    } = {};
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (funds !== undefined) updateData.funds = funds;

    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    }

    // Update admin status
    if (is_admin !== undefined) {
      if (is_admin) {
        // Add to admins if not already
        const { error: insertError } = await supabaseAdmin
          .from('admins')
          .upsert({ user_id: userId });

        if (insertError) {
          console.error('Error assigning admin role:', insertError);
          return NextResponse.json({ error: 'Failed to assign admin role' }, { status: 500 });
        }
      } else {
        // Remove from admins
        const { error: deleteError } = await supabaseAdmin
          .from('admins')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error removing admin role:', deleteError);
          return NextResponse.json({ error: 'Failed to remove admin role' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Delete from admins first (due to foreign key)
    const { error: adminDeleteError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('user_id', userId);

    if (adminDeleteError) {
      console.error('Error deleting admin record:', adminDeleteError);
      // Continue anyway
    }

    // Delete profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
    }

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
