import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whop_user_id = searchParams.get('whop_user_id');
    const experience_id = searchParams.get('experience_id');
    const bankroll_id = searchParams.get('bankroll_id');
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

    // Build query for transactions
    let query = supabase
      .from('transactions')
      .select(`
        *,
        bankroll:bankrolls!transactions_bankroll_id_fkey(
          id,
          name,
          currency
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by bankroll if specified
    if (bankroll_id) {
      query = query.eq('bankroll_id', bankroll_id);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error in transactions GET:', error);
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
      bankroll_id,
      type,
      amount,
      description
    } = body;

    if (!whop_user_id || !experience_id || !bankroll_id || !type || !amount) {
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

    // Get bankroll to verify ownership
    const { data: bankroll, error: bankrollError } = await supabase
      .from('bankrolls')
      .select('*')
      .eq('id', bankroll_id)
      .eq('user_id', user.id)
      .single();

    if (bankrollError) {
      console.error('Error fetching bankroll:', bankrollError);
      return NextResponse.json(
        { error: 'Bankroll not found' },
        { status: 404 }
      );
    }

    // Create transaction
    const { data: newTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        bankroll_id,
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        description
      })
      .select(`
        *,
        bankroll:bankrolls!transactions_bankroll_id_fkey(
          id,
          name,
          currency
        )
      `)
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Update bankroll current amount
    let newAmount = bankroll.current_amount;
    if (type === 'deposit') {
      newAmount += parseFloat(amount);
    } else if (type === 'withdrawal') {
      newAmount -= parseFloat(amount);
    }

    const { error: updateError } = await supabase
      .from('bankrolls')
      .update({
        current_amount: newAmount,
        last_transaction_at: new Date().toISOString(),
        total_deposited: type === 'deposit' ? 
          (bankroll.total_deposited || 0) + parseFloat(amount) : 
          bankroll.total_deposited,
        total_withdrawn: type === 'withdrawal' ? 
          (bankroll.total_withdrawn || 0) + parseFloat(amount) : 
          bankroll.total_withdrawn
      })
      .eq('id', bankroll_id);

    if (updateError) {
      console.error('Error updating bankroll:', updateError);
    }

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    console.error('Error in transactions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
