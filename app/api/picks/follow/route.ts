import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pick_id,
      bet_amount,
      actual_odds_american,
      whop_user_id,
      experience_id
    } = body;

    if (!pick_id || !whop_user_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the pick
    const { data: pick, error: pickError } = await supabase
      .from('picks')
      .select('*, capper:users!picks_capper_id_fkey(*)')
      .eq('id', pick_id)
      .single();

    if (pickError) {
      console.error('Error fetching pick:', pickError);
      return NextResponse.json(
        { error: 'Pick not found' },
        { status: 404 }
      );
    }

    // Check if user is already following this pick
    const { data: existingFollow, error: followCheckError } = await supabase
      .from('pick_follows')
      .select('*')
      .eq('user_id', user.id)
      .eq('pick_id', pick_id)
      .single();

    if (followCheckError && followCheckError.code !== 'PGRST116') {
      console.error('Error checking existing follow:', followCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing follow' },
        { status: 500 }
      );
    }

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this pick' },
        { status: 400 }
      );
    }

    // Create pick follow
    const { data: newFollow, error: followError } = await supabase
      .from('pick_follows')
      .insert({
        user_id: user.id,
        pick_id,
        capper_id: pick.capper_id,
        bet_amount,
        actual_odds_american
      })
      .select('*')
      .single();

    if (followError) {
      console.error('Error creating pick follow:', followError);
      return NextResponse.json(
        { error: 'Failed to follow pick' },
        { status: 500 }
      );
    }

    // Update pick follows count
    const { error: updatePickError } = await supabase
      .from('picks')
      .update({
        follows: (pick.follows || 0) + 1
      })
      .eq('id', pick_id);

    if (updatePickError) {
      console.error('Error updating pick follows count:', updatePickError);
    }

    return NextResponse.json({ follow: newFollow });
  } catch (error) {
    console.error('Error in pick follow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pick_id = searchParams.get('pick_id');
    const whop_user_id = searchParams.get('whop_user_id');
    const experience_id = searchParams.get('experience_id');

    if (!pick_id || !whop_user_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete pick follow
    const { error: deleteError } = await supabase
      .from('pick_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('pick_id', pick_id);

    if (deleteError) {
      console.error('Error deleting pick follow:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unfollow pick' },
        { status: 500 }
      );
    }

    // Update pick follows count
    const { data: pick, error: pickError } = await supabase
      .from('picks')
      .select('follows')
      .eq('id', pick_id)
      .single();

    if (!pickError && pick) {
      const { error: updatePickError } = await supabase
        .from('picks')
        .update({
          follows: Math.max(0, (pick.follows || 0) - 1)
        })
        .eq('id', pick_id);

      if (updatePickError) {
        console.error('Error updating pick follows count:', updatePickError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in pick unfollow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
