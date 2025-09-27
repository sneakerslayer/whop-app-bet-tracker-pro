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

    // Get user stats from database
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching user stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch user stats' },
        { status: 500 }
      );
    }

    // Get chart data from settled bets
    const { data: chartData, error: chartError } = await supabase
      .from('bets')
      .select('created_at, actual_return, stake')
      .eq('user_id', user.id)
      .eq('whop_experience_id', experience_id)
      .in('result', ['won', 'lost', 'push'])
      .order('created_at', { ascending: true });

    if (chartError) {
      console.error('Error fetching chart data:', chartError);
    }

    // Process chart data
    const processedChartData = chartData?.map((bet, index) => {
      const profit = bet.actual_return - bet.stake;
      const cumulativeProfit = chartData
        .slice(0, index + 1)
        .reduce((sum, b) => sum + (b.actual_return - b.stake), 0);
      
      return {
        date: bet.created_at,
        profit: cumulativeProfit,
        roi: index === 0 ? 0 : (cumulativeProfit / (index + 1)) * 100
      };
    }) || [];

    // Return default stats if user doesn't exist
    const defaultStats = {
      total_bets: 0,
      win_rate: 0,
      roi: 0,
      net_profit: 0,
      current_streak: 0,
      units_won: 0,
      wins: 0,
      losses: 0,
      pending: 0
    };

    return NextResponse.json({
      stats: stats || defaultStats,
      chartData: processedChartData
    });

  } catch (error) {
    console.error('Error in user-stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
