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

    // Check if user exists, create if not
    console.log('Checking for existing user:', { whop_user_id, experience_id });
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user:', userError);
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      );
    }

    console.log('Existing user found:', existingUser ? { id: existingUser.id, is_capper: existingUser.is_capper } : 'none');

    let userId = existingUser?.id;

    // Create user if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          whop_user_id,
          whop_experience_id: experience_id,
          username,
          display_name: display_name || username,
          is_capper: true,
          is_verified: is_verified || false
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      userId = newUser.id;

      // Initialize user stats
      await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          whop_experience_id: experience_id
        });
    } else {
      // Update existing user to be a capper
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_capper: true,
          is_verified: is_verified || false,
          display_name: display_name || username
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }
      console.log('Updated existing user to be capper');
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
