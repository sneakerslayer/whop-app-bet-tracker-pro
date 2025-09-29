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
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    // Handle user not found vs actual error
    if (userError && userError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Database error fetching user:', userError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Create user if not found or if userError indicates no rows found
    if (!user || userError?.code === 'PGRST116') {
      console.log('User not found, using upsert to create/get user:', { whop_user_id, experience_id });
      
      try {
        // Use upsert to handle race conditions
        const { data: upsertedUser, error: upsertError } = await supabase
          .from('users')
          .upsert({
            whop_user_id,
            whop_experience_id: experience_id,
            username: whop_user_id,
            display_name: whop_user_id,
            is_capper: true // Make them a capper by default for testing
          }, {
            onConflict: 'whop_user_id'
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error upserting user:', upsertError);
          return NextResponse.json(
            { error: 'Failed to create/get user: ' + upsertError.message },
            { status: 500 }
          );
        }

        user = upsertedUser;
        console.log('Successfully upserted user:', { 
          id: user.id, 
          is_capper: user.is_capper,
          whop_user_id: user.whop_user_id 
        });

        // Initialize user stats (ignore if already exists)
        const { error: statsError } = await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            whop_experience_id: experience_id
          }, {
            onConflict: 'user_id'
          });

        if (statsError) {
          console.warn('Error upserting user stats:', statsError);
          // Don't fail the whole operation for stats error
        }

      } catch (err) {
        console.error('Exception during user upsert:', err);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
    }

    console.log('Current user status:', { 
      id: user.id, 
      is_capper: user.is_capper, 
      whop_user_id: user.whop_user_id,
      username: user.username,
      display_name: user.display_name
    });

    // Ensure user has capper privileges for testing
    if (!user.is_capper) {
      console.log('User is not a capper, making them a capper for testing...');
      
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_capper: true })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating user to capper:', updateError);
          return NextResponse.json(
            { error: 'Failed to grant capper privileges: ' + updateError.message },
            { status: 500 }
          );
        } else {
          console.log('Successfully updated user to capper');
          user.is_capper = true;
        }
      } catch (err) {
        console.error('Exception during capper update:', err);
        return NextResponse.json(
          { error: 'Failed to update user privileges' },
          { status: 500 }
        );
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
      console.log('Admin posting pick for capper:', { admin_id: user.id, target_capper_id: capper_id });
    } else {
      // Regular user posting their own pick
      console.log('Regular user posting own pick - Final authorization check:', { 
        user_id: user.id,
        whop_user_id: user.whop_user_id,
        is_capper: user.is_capper,
        typeof_is_capper: typeof user.is_capper
      });
      
      if (!user.is_capper) {
        console.error('AUTHORIZATION FAILED - User is not a capper:', {
          user_id: user.id,
          whop_user_id: user.whop_user_id,
          is_capper: user.is_capper,
          user_object: JSON.stringify(user, null, 2)
        });
        return NextResponse.json(
          { error: 'User is not authorized to create picks' },
          { status: 403 }
        );
      }
      
      console.log('AUTHORIZATION SUCCESS - User is authorized to create picks');
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
