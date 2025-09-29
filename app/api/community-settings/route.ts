import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experience_id = searchParams.get('experience_id');

    if (!experience_id) {
      return NextResponse.json(
        { error: 'Missing experience_id parameter' },
        { status: 400 }
      );
    }

    // Get community settings
    const { data: settings, error } = await supabase
      .from('community_settings')
      .select('*')
      .eq('whop_experience_id', experience_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        return NextResponse.json({
          settings: {
            whop_experience_id: experience_id,
            discord_webhook_url: null,
            discord_channel_id: null,
            enable_pick_notifications: true,
            enable_result_notifications: true,
            default_unit_size: 100,
            minimum_bet_amount: 10,
            enable_photo_verification: true,
            require_capper_verification: false,
            leaderboard_min_bets: 10,
            featured_timeframe: 'monthly',
            show_profit_amounts: false,
            enable_premium_picks: true,
            default_pick_price: 0,
            revenue_share_percentage: 70
          }
        });
      }
      
      console.error('Error fetching community settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in community settings GET:', error);
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
      whop_experience_id,
      discord_webhook_url,
      discord_channel_id,
      enable_pick_notifications,
      enable_result_notifications,
      default_unit_size,
      minimum_bet_amount,
      enable_photo_verification,
      require_capper_verification,
      leaderboard_min_bets,
      featured_timeframe,
      show_profit_amounts,
      enable_premium_picks,
      default_pick_price,
      revenue_share_percentage
    } = body;

    if (!whop_experience_id) {
      return NextResponse.json(
        { error: 'Missing whop_experience_id' },
        { status: 400 }
      );
    }

    // Upsert community settings
    const { data: settings, error } = await supabase
      .from('community_settings')
      .upsert({
        whop_experience_id,
        discord_webhook_url,
        discord_channel_id,
        enable_pick_notifications,
        enable_result_notifications,
        default_unit_size,
        minimum_bet_amount,
        enable_photo_verification,
        require_capper_verification,
        leaderboard_min_bets,
        featured_timeframe,
        show_profit_amounts,
        enable_premium_picks,
        default_pick_price,
        revenue_share_percentage,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error updating community settings:', error);
      return NextResponse.json(
        { error: 'Failed to update community settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in community settings POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
