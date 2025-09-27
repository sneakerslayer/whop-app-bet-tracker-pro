import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whop_user_id = searchParams.get('whop_user_id');
    const experience_id = searchParams.get('experience_id');

    if (!whop_user_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // First, get the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's bets from database
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .eq('whop_experience_id', experience_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bets: bets || [] });

  } catch (error) {
    console.error('Error in bets GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      whop_user_id,
      experience_id,
      sport,
      bet_type,
      description,
      odds_american,
      stake,
      sportsbook,
      game_date,
      notes
    } = body;

    // Validate required fields
    if (!whop_user_id || !experience_id || !sport || !bet_type || !description || !odds_american || !stake) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, get or create the user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          whop_user_id,
          whop_experience_id: experience_id,
          username: `user_${whop_user_id.slice(-6)}`,
          display_name: `User ${whop_user_id.slice(-6)}`
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
      user = newUser;
    } else if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    // Calculate potential return
    let potential_return = 0;
    if (odds_american > 0) {
      potential_return = stake * (odds_american / 100);
    } else {
      potential_return = stake * (100 / Math.abs(odds_american));
    }

    // Insert new bet
    const { data: newBet, error } = await supabase
      .from('bets')
      .insert({
        user_id: user!.id,
        whop_experience_id: experience_id,
        sport,
        bet_type,
        description,
        odds_american,
        stake,
        potential_return,
        actual_return: 0,
        result: 'pending',
        sportsbook,
        game_date,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bet:', error);
      return NextResponse.json(
        { error: 'Failed to create bet' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bet: newBet }, { status: 201 });

  } catch (error) {
    console.error('Error in bets POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
