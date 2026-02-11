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

// GET: List all users with profiles and admin status
export async function GET() {
  try {
    // Get all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('email');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get all admin user_ids
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('user_id');

    if (adminError) {
      console.error('Error fetching admins:', adminError);
      return NextResponse.json({ error: 'Failed to fetch admin status' }, { status: 500 });
    }

    const adminUserIds = new Set(admins?.map(a => a.user_id) || []);

    // Combine data
    const users = profiles?.map(profile => ({
      ...profile,
      is_admin: adminUserIds.has(profile.id),
    })) || [];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, funds = 0, is_admin = false } = await request.json();

    if (!email || !password || !first_name) {
      return NextResponse.json({ error: 'Email, password, and first name are required' }, { status: 400 });
    }

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Insert profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        first_name,
        last_name,
        funds,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Try to delete the auth user if profile insert failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // If admin, add to admins table
    if (is_admin) {
      const { error: adminError } = await supabaseAdmin
        .from('admins')
        .insert({ user_id: userId });

      if (adminError) {
        console.error('Error assigning admin role:', adminError);
        // Don't fail the whole operation, just log
      }
    }

    return NextResponse.json({ message: 'User created successfully', user_id: userId }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
