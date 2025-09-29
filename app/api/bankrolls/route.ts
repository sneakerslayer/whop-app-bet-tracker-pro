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

    // Get user's bankrolls
    const { data: bankrolls, error } = await supabase
      .from('bankrolls')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bankrolls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bankrolls' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bankrolls });
  } catch (error) {
    console.error('Error in bankrolls GET:', error);
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
      name,
      starting_amount,
      currency,
      sport,
      sportsbook,
      max_bet_percentage,
      stop_loss_threshold,
      target_profit
    } = body;

    if (!whop_user_id || !experience_id || !starting_amount) {
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

    // Create new bankroll
    const { data: newBankroll, error } = await supabase
      .from('bankrolls')
      .insert({
        user_id: user.id,
        name: name || 'Main Bankroll',
        starting_amount: parseFloat(starting_amount),
        current_amount: parseFloat(starting_amount),
        currency: currency || 'USD',
        sport,
        sportsbook,
        max_bet_percentage: max_bet_percentage || 5,
        stop_loss_threshold,
        target_profit
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating bankroll:', error);
      return NextResponse.json(
        { error: 'Failed to create bankroll' },
        { status: 500 }
      );
    }

    // Create initial deposit transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        bankroll_id: newBankroll.id,
        user_id: user.id,
        type: 'deposit',
        amount: parseFloat(starting_amount),
        description: 'Initial deposit'
      });

    if (transactionError) {
      console.error('Error creating initial transaction:', transactionError);
    }

    return NextResponse.json({ bankroll: newBankroll });
  } catch (error) {
    console.error('Error in bankrolls POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
