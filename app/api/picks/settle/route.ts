import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pick_id,
      result,
      actual_odds_american,
      whop_user_id,
      experience_id
    } = body;

    if (!pick_id || !result || !whop_user_id || !experience_id) {
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
      .select('*')
      .eq('id', pick_id)
      .single();

    if (pickError) {
      console.error('Error fetching pick:', pickError);
      return NextResponse.json(
        { error: 'Pick not found' },
        { status: 404 }
      );
    }

    // Check if user is the capper who created this pick
    if (pick.capper_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to settle this pick' },
        { status: 403 }
      );
    }

    // Calculate ROI based on result
    let roi = 0;
    if (result === 'won' && actual_odds_american) {
      if (actual_odds_american > 0) {
        roi = actual_odds_american / 100;
      } else {
        roi = 100 / Math.abs(actual_odds_american);
      }
    } else if (result === 'lost') {
      roi = -1; // -100% ROI for losses
    }

    // Update the pick
    const { data: updatedPick, error: updateError } = await supabase
      .from('picks')
      .update({
        result,
        actual_odds_american,
        roi,
        updated_at: new Date().toISOString()
      })
      .eq('id', pick_id)
      .select(`
        *,
        capper:users!picks_capper_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating pick:', updateError);
      return NextResponse.json(
        { error: 'Failed to settle pick' },
        { status: 500 }
      );
    }

    // Update pick follows with results
    const { error: followsError } = await supabase
      .from('pick_follows')
      .update({
        result,
        actual_odds_american,
        profit_loss: result === 'won' ? 
          (actual_odds_american > 0 ? 
            actual_odds_american / 100 : 
            100 / Math.abs(actual_odds_american)) : 
          (result === 'lost' ? -1 : 0)
      })
      .eq('pick_id', pick_id);

    if (followsError) {
      console.error('Error updating pick follows:', followsError);
    }

    return NextResponse.json({ pick: updatedPick });
  } catch (error) {
    console.error('Error in pick settle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
