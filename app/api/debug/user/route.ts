import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whop_user_id = searchParams.get('whop_user_id');
    const experience_id = searchParams.get('experience_id');

    if (!whop_user_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing whop_user_id or experience_id parameters' },
        { status: 400 }
      );
    }

    console.log('Debug: Looking for user:', { whop_user_id, experience_id });

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Debug: Database error:', userError);
      return NextResponse.json({
        error: 'Database error',
        details: userError
      }, { status: 500 });
    }

    if (!user || userError?.code === 'PGRST116') {
      console.log('Debug: User not found');
      return NextResponse.json({
        found: false,
        message: 'User not found in database',
        whop_user_id,
        experience_id
      });
    }

    console.log('Debug: User found:', user);

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        whop_user_id: user.whop_user_id,
        whop_experience_id: user.whop_experience_id,
        username: user.username,
        display_name: user.display_name,
        is_capper: user.is_capper,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
