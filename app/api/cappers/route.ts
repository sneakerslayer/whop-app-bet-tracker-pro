import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experience_id = searchParams.get('experience_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!experience_id) {
      return NextResponse.json(
        { error: 'Missing experience_id parameter' },
        { status: 400 }
      );
    }

    // Get cappers with their stats
    const { data: cappers, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        is_verified,
        created_at,
        user_stats!inner(
          total_bets,
          wins,
          losses,
          win_rate,
          roi,
          net_profit,
          current_streak,
          best_streak
        )
      `)
      .eq('whop_experience_id', experience_id)
      .eq('is_capper', true)
      .eq('user_stats.whop_experience_id', experience_id)
      .order('user_stats.roi', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching cappers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cappers' },
        { status: 500 }
      );
    }

    // Get recent picks for each capper
    const capperIds = cappers?.map(c => c.id) || [];
    const { data: recentPicks, error: picksError } = await supabase
      .from('picks')
      .select(`
        id,
        capper_id,
        sport,
        bet_type,
        description,
        result,
        roi,
        posted_at
      `)
      .in('capper_id', capperIds)
      .eq('whop_experience_id', experience_id)
      .order('posted_at', { ascending: false })
      .limit(5);

    if (picksError) {
      console.error('Error fetching recent picks:', picksError);
    }

    // Group picks by capper
    const picksByCapper = recentPicks?.reduce((acc, pick) => {
      if (!acc[pick.capper_id]) {
        acc[pick.capper_id] = [];
      }
      acc[pick.capper_id].push(pick);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Add recent picks to cappers
    const cappersWithPicks = cappers?.map(capper => ({
      ...capper,
      recent_picks: picksByCapper[capper.id] || []
    }));

    return NextResponse.json({ cappers: cappersWithPicks });
  } catch (error) {
    console.error('Error in cappers GET:', error);
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
      action
    } = body;

    if (!whop_user_id || !experience_id || !action) {
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

    let updateData: any = {};
    
    if (action === 'become_capper') {
      updateData.is_capper = true;
    } else if (action === 'verify_capper') {
      updateData.is_verified = true;
    } else if (action === 'unverify_capper') {
      updateData.is_verified = false;
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error in cappers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
