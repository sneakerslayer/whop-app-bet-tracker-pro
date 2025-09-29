import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whop_user_id = searchParams.get('whop_user_id');
    const experience_id = searchParams.get('experience_id');
    const capper_id = searchParams.get('capper_id');
    const access_tier = searchParams.get('access_tier') || 'public';
    const sport = searchParams.get('sport');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!whop_user_id || !experience_id) {
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

    // Build query for picks
    let query = supabase
      .from('picks')
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
      .eq('whop_experience_id', experience_id)
      .order('posted_at', { ascending: false })
      .limit(limit);

    // Filter by capper if specified
    if (capper_id) {
      query = query.eq('capper_id', capper_id);
    }

    // Filter by sport if specified
    if (sport) {
      query = query.eq('sport', sport);
    }

    // Filter by access tier
    if (access_tier === 'public') {
      query = query.eq('access_tier', 'public');
    } else if (access_tier === 'premium') {
      query = query.in('access_tier', ['public', 'premium']);
    }

    const { data: picks, error } = await query;

    if (error) {
      console.error('Error fetching picks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch picks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ picks });
  } catch (error) {
    console.error('Error in picks GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Picks POST request body:', JSON.stringify(body, null, 2));
    
    const {
      whop_user_id,
      experience_id,
      capper_id, // For admin posting on behalf of cappers
      sport,
      league,
      bet_type,
      description,
      reasoning,
      confidence,
      recommended_odds_american,
      recommended_odds_decimal,
      recommended_units,
      max_bet_amount,
      access_tier,
      is_premium,
      price,
      game_time,
      expires_at,
      tags
    } = body;

    if (!whop_user_id || !experience_id || !sport || !bet_type || !description) {
      console.log('Missing required fields:', { whop_user_id, experience_id, sport, bet_type, description });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    console.log('Looking for user:', { whop_user_id, experience_id });
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
      console.log('User not found:', { whop_user_id, experience_id });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Found user:', { id: user.id, is_capper: user.is_capper, whop_user_id: user.whop_user_id });

    // If user is not a capper, let's check if they should be one
    if (!user.is_capper) {
      console.log('User is not a capper, checking if they should be...');
      // For testing, let's make the current user a capper automatically
      if (user.whop_user_id === 'user_ey15Seq4GOxYU') {
        console.log('Making test user a capper automatically');
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_capper: true })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating user to capper:', updateError);
        } else {
          console.log('Successfully updated user to capper');
          user.is_capper = true;
        }
      }
    }

    let targetCapperId = user.id;

    // If capper_id is provided (admin posting on behalf of capper)
    if (capper_id) {
      // TODO: Add admin verification here
      // For now, we'll allow any user to post on behalf of others for testing
      
      // Verify the target capper exists and is a capper
      const { data: targetCapper, error: capperError } = await supabase
        .from('users')
        .select('*')
        .eq('id', capper_id)
        .eq('whop_experience_id', experience_id)
        .single();

      if (capperError || !targetCapper) {
        return NextResponse.json(
          { error: 'Target capper not found' },
          { status: 404 }
        );
      }

      if (!targetCapper.is_capper) {
        return NextResponse.json(
          { error: 'Target user is not a capper' },
          { status: 403 }
        );
      }

      targetCapperId = capper_id;
    } else {
      // Regular user posting their own pick
      console.log('Regular user posting pick, is_capper:', user.is_capper);
      if (!user.is_capper) {
        console.log('User is not a capper, denying access');
        return NextResponse.json(
          { error: 'User is not authorized to create picks' },
          { status: 403 }
        );
      }
    }

    // Create new pick
    console.log('Creating pick with targetCapperId:', targetCapperId);
    const pickData = {
      capper_id: targetCapperId,
      whop_experience_id: experience_id,
      sport,
      league,
      bet_type,
      description,
      reasoning,
      confidence,
      recommended_odds_american,
      recommended_odds_decimal,
      recommended_units,
      max_bet_amount,
      access_tier: access_tier || 'public',
      is_premium: is_premium || false,
      price,
      game_time,
      expires_at,
      tags
    };
    console.log('Pick data:', JSON.stringify(pickData, null, 2));
    
    const { data: newPick, error } = await supabase
      .from('picks')
      .insert(pickData)
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

    if (error) {
      console.error('Error creating pick:', error);
      return NextResponse.json(
        { error: 'Failed to create pick' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pick: newPick });
  } catch (error) {
    console.error('Error in picks POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
