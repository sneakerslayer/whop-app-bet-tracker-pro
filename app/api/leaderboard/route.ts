import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whop_user_id = searchParams.get('whop_user_id');
    const experience_id = searchParams.get('experience_id');
    const timeframe = searchParams.get('timeframe') || 'monthly';
    const sport = searchParams.get('sport');
    const bet_type = searchParams.get('bet_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!whop_user_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check for cached leaderboard first
    const cacheKey = `${experience_id}_${timeframe}_${sport || 'all'}_${bet_type || 'all'}`;
    const { data: cachedLeaderboard, error: cacheError } = await supabase
      .from('leaderboard_cache')
      .select('*')
      .eq('whop_experience_id', experience_id)
      .eq('timeframe', timeframe)
      .eq('sport', sport || null)
      .eq('bet_type', bet_type || null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedLeaderboard && !cacheError) {
      return NextResponse.json({ 
        leaderboard: cachedLeaderboard.rankings,
        cached: true,
        generated_at: cachedLeaderboard.generated_at
      });
    }

    // Calculate date filter based on timeframe
    let dateFilter = new Date();
    switch (timeframe) {
      case 'daily':
        dateFilter.setDate(dateFilter.getDate() - 1);
        break;
      case 'weekly':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'monthly':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
      case 'all_time':
        dateFilter = new Date(0); // Start of epoch
        break;
      default:
        dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    // Get all user stats for the experience
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select(`
        *,
        users!inner(whop_user_id, username, display_name, avatar_url, is_verified, is_capper)
      `)
      .eq('whop_experience_id', experience_id)
      .gte('updated_at', dateFilter.toISOString())
      .gte('total_bets', 10) // Minimum 10 bets to appear on leaderboard
      .order('roi', { ascending: false })
      .limit(limit);

    if (statsError) {
      console.error('Error fetching leaderboard stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Process leaderboard data
    const leaderboard = (userStats || []).map((stats, index) => {
      const user = stats.users;
      
      return {
        rank: index + 1,
        user_id: user.whop_user_id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        is_capper: user.is_capper,
        total_bets: stats.total_bets,
        win_rate: stats.win_rate,
        roi: stats.roi,
        net_profit: stats.net_profit,
        current_streak: stats.current_streak
      };
    });

    // Cache the leaderboard
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour cache
    const { error: cacheInsertError } = await supabase
      .from('leaderboard_cache')
      .upsert({
        whop_experience_id: experience_id,
        timeframe,
        sport: sport || null,
        bet_type: bet_type || null,
        rankings: leaderboard,
        expires_at: expiresAt.toISOString()
      });

    if (cacheInsertError) {
      console.error('Error caching leaderboard:', cacheInsertError);
    }

    return NextResponse.json({ 
      leaderboard,
      cached: false,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
