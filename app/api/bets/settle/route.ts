import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bet_id, result, whop_user_id, experience_id } = body;

    // Validate required fields
    if (!bet_id || !result || !whop_user_id || !experience_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate result
    if (!['won', 'lost', 'push'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be won, lost, or push' },
        { status: 400 }
      );
    }

    // First, get the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('whop_user_id', whop_user_id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the bet first
    const { data: bet, error: fetchError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', bet_id)
      .eq('user_id', user.id)
      .eq('whop_experience_id', experience_id)
      .single();

    if (fetchError || !bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Calculate actual return based on result
    let actual_return = 0;
    if (result === 'won') {
      actual_return = bet.potential_return + bet.stake;
    } else if (result === 'push') {
      actual_return = bet.stake; // Return original stake
    }
    // For 'lost', actual_return remains 0

    // Update the bet
    const { data: updatedBet, error: updateError } = await supabase
      .from('bets')
      .update({
        result,
        actual_return,
        settled_at: new Date().toISOString()
      })
      .eq('id', bet_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating bet:', updateError);
      return NextResponse.json(
        { error: 'Failed to settle bet' },
        { status: 500 }
      );
    }

    // Update user stats
    await updateUserStats(user.id, experience_id);

    // Update bankrolls with transaction
    await updateBankrollsWithBetResult(user.id, bet, result, actual_return);

    return NextResponse.json({ bet: updatedBet });

  } catch (error) {
    console.error('Error in settle bet API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateUserStats(user_id: string, experience_id: string) {
  try {
    // Get all settled bets for the user
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user_id)
      .eq('whop_experience_id', experience_id)
      .in('result', ['won', 'lost', 'push']);

    if (error) {
      console.error('Error fetching bets for stats:', error);
      return;
    }

    // Calculate stats
    const total_bets = bets.length;
    const wins = bets.filter(bet => bet.result === 'won').length;
    const losses = bets.filter(bet => bet.result === 'lost').length;
    const win_rate = total_bets > 0 ? (wins / total_bets) * 100 : 0;
    
    const net_profit = bets.reduce((sum, bet) => {
      if (bet.result === 'won') {
        return sum + (bet.actual_return - bet.stake);
      } else if (bet.result === 'lost') {
        return sum - bet.stake;
      }
      return sum; // push returns 0
    }, 0);

    const roi = total_bets > 0 ? (net_profit / bets.reduce((sum, bet) => sum + bet.stake, 0)) * 100 : 0;

    // Calculate current streak
    let current_streak = 0;
    for (let i = bets.length - 1; i >= 0; i--) {
      if (bets[i].result === 'won') {
        current_streak++;
      } else if (bets[i].result === 'lost') {
        current_streak = -1;
        break;
      }
    }

    // Calculate units won
    const units_won = bets.reduce((sum, bet) => {
      if (bet.result === 'won') {
        return sum + (bet.actual_return - bet.stake) / bet.stake;
      } else if (bet.result === 'lost') {
        return sum - 1;
      }
      return sum;
    }, 0);

    // Get pending bets count
    const { data: pendingBets } = await supabase
      .from('bets')
      .select('id')
      .eq('user_id', user_id)
      .eq('whop_experience_id', experience_id)
      .eq('result', 'pending');

    const pending = pendingBets?.length || 0;

    // Upsert user stats
    const { error: upsertError } = await supabase
      .from('user_stats')
      .upsert({
        user_id,
        whop_experience_id: experience_id,
        total_bets,
        win_rate,
        roi,
        net_profit,
        current_streak,
        units_won,
        wins,
        losses,
        pending,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating user stats:', upsertError);
    }

  } catch (error) {
    console.error('Error in updateUserStats:', error);
  }
}

async function updateBankrollsWithBetResult(user_id: string, bet: any, result: string, actual_return: number) {
  try {
    // Get user's active bankrolls
    const { data: bankrolls, error: bankrollError } = await supabase
      .from('bankrolls')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (bankrollError || !bankrolls || bankrolls.length === 0) {
      console.log('No active bankrolls found for user');
      return;
    }

    // Find the most appropriate bankroll (prefer sport-specific, then general)
    let targetBankroll = bankrolls.find(br => br.sport === bet.sport) || bankrolls[0];

    if (!targetBankroll) return;

    let transactionType = '';
    let transactionAmount = 0;
    let bankrollAdjustment = 0;

    if (result === 'won') {
      transactionType = 'win';
      transactionAmount = actual_return - bet.stake; // Profit amount
      bankrollAdjustment = transactionAmount;
    } else if (result === 'lost') {
      transactionType = 'loss';
      transactionAmount = bet.stake; // Loss amount
      bankrollAdjustment = -transactionAmount;
    } else if (result === 'push') {
      // Push returns stake, no profit/loss
      return;
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        bankroll_id: targetBankroll.id,
        user_id: user_id,
        type: transactionType,
        amount: transactionAmount,
        description: `Bet ${result}: ${bet.description}`
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return;
    }

    // Update bankroll current amount
    const newCurrentAmount = targetBankroll.current_amount + bankrollAdjustment;
    
    const { error: bankrollUpdateError } = await supabase
      .from('bankrolls')
      .update({
        current_amount: newCurrentAmount,
        last_transaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', targetBankroll.id);

    if (bankrollUpdateError) {
      console.error('Error updating bankroll:', bankrollUpdateError);
    }

  } catch (error) {
    console.error('Error in updateBankrollsWithBetResult:', error);
  }
}
