import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Add/Update Capper (Admin Only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { whop_user_id, username, display_name, is_verified, experience_id, admin_user_id } = body;

    // Validate required fields
    if (!whop_user_id || !username || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Add actual admin verification
    // For now, we'll allow any user to add cappers for testing
    // In production, you should check if admin_user_id has admin privileges

    // Use upsert to create or update user as capper
    console.log('Upserting user as capper:', { whop_user_id, experience_id, username });
    
    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert({
        whop_user_id,
        whop_experience_id: experience_id,
        username,
        display_name: display_name || username,
        is_capper: true,
        is_verified: is_verified || false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'whop_user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting user:', upsertError);
      return NextResponse.json(
        { error: 'Failed to create/update user', details: upsertError.message },
        { status: 500 }
      );
    }

    console.log('User upserted successfully:', { id: upsertedUser.id, is_capper: upsertedUser.is_capper });
    
    const userId = upsertedUser.id;

    // Initialize user stats if they don't exist
    const { error: statsError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        whop_experience_id: experience_id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: true
      });

    if (statsError) {
      console.error('Error initializing user stats:', statsError);
      // Don't fail the request for stats error, just log it
    }

    return NextResponse.json({ 
      success: true,
      user_id: userId 
    });

  } catch (error) {
    console.error('Error in admin cappers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove Capper (Admin Only)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { capper_id, experience_id, admin_user_id } = body;

    // Validate required fields
    if (!capper_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Add actual admin verification
    // For now, we'll allow any user to remove cappers for testing

    // Update user to remove capper status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_capper: false,
        is_verified: false
      })
      .eq('id', capper_id)
      .eq('whop_experience_id', experience_id);

    if (updateError) {
      console.error('Error removing capper:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove capper' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error in admin cappers DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
