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
    const {
      whop_user_id,
      experience_id,
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

    // Check if user is a capper
    if (!user.is_capper) {
      return NextResponse.json(
        { error: 'User is not authorized to create picks' },
        { status: 403 }
      );
    }

    // Create new pick
    const { data: newPick, error } = await supabase
      .from('picks')
      .insert({
        capper_id: user.id,
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
      })
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
