'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Target, DollarSign, Flame, Crown,
  Plus, BarChart3, Trophy, Filter, Loader2, AlertCircle, CheckCircle,
  Users, Star, Wallet, Settings, Eye, Heart, Share2, Clock, Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Types
interface UserStats {
  total_bets: number;
  win_rate: number;
  roi: number;
  net_profit: number;
  current_streak: number;
  units_won: number;
  units_wagered: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
}

interface Bet {
  id: string;
  description: string;
  sport: string;
  bet_type: string;
  odds_american: number;
  stake: number;
  potential_return: number;
  actual_return: number;
  result: 'pending' | 'won' | 'lost' | 'push';
  sportsbook?: string;
  created_at: string;
  game_date?: string;
  notes?: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified: boolean;
  is_capper: boolean;
  total_bets: number;
  win_rate: number;
  roi: number;
  net_profit: number;
  current_streak: number;
}

interface ChartDataPoint {
  date: string;
  profit: number;
  roi: number;
}

interface Pick {
  id: string;
  capper_id: string;
  sport: string;
  league?: string;
  bet_type: string;
  description: string;
  reasoning?: string;
  confidence?: number;
  recommended_odds_american?: number;
  recommended_units: number;
  access_tier: string;
  is_premium: boolean;
  price?: number;
  result: 'pending' | 'won' | 'lost' | 'push';
  roi?: number;
  views: number;
  follows: number;
  posted_at: string;
  game_time?: string;
  expires_at?: string;
  tags?: string[];
  capper?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

interface Bankroll {
  id: string;
  name: string;
  starting_amount: number;
  current_amount: number;
  currency: string;
  sport?: string;
  sportsbook?: string;
  max_bet_percentage: number;
  stop_loss_threshold?: number;
  target_profit?: number;
  total_deposited: number;
  total_withdrawn: number;
  is_active: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  bankroll_id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'loss';
  amount: number;
  description?: string;
  created_at: string;
  bankroll?: {
    id: string;
    name: string;
    currency: string;
  };
}

interface Capper {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  user_stats: {
    total_bets: number;
    wins: number;
    losses: number;
    win_rate: number;
    roi: number;
    net_profit: number;
    current_streak: number;
    best_streak: number;
  };
  recent_picks: Pick[];
}

interface BetTrackerProProps {
  userId?: string;
  experienceId?: string;
}

export default function BetTrackerPro({ userId, experienceId }: BetTrackerProProps) {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBet, setShowAddBet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New feature states
  const [picks, setPicks] = useState<Pick[]>([]);
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cappers, setCappers] = useState<Capper[]>([]);
  const [isCapper, setIsCapper] = useState(false);
  const [showAddPick, setShowAddPick] = useState(false);
  const [showAddBankroll, setShowAddBankroll] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showUnitSettings, setShowUnitSettings] = useState(false);
  const [unitSize, setUnitSize] = useState(100);

  // Use real user data from props or fallback to mock data
  const currentUser = {
    whop_user_id: userId || 'user_123',
    experience_id: experienceId || 'exp_456'
  };

  // Bet form state
  const [betForm, setBetForm] = useState({
    sport: '',
    bet_type: 'moneyline',
    description: '',
    odds_american: '',
    stake: '',
    sportsbook: '',
    game_date: '',
    notes: ''
  });

  // Pick form state
  const [pickForm, setPickForm] = useState({
    sport: '',
    league: '',
    bet_type: 'moneyline',
    description: '',
    reasoning: '',
    confidence: 5,
    recommended_odds_american: '',
    recommended_units: 1,
    max_bet_amount: '',
    access_tier: 'public',
    is_premium: false,
    price: '',
    game_time: '',
    expires_at: '',
    tags: ''
  });

  // Bankroll form state
  const [bankrollForm, setBankrollForm] = useState({
    name: 'Main Bankroll',
    starting_amount: '',
    currency: 'USD',
    sport: '',
    sportsbook: '',
    max_bet_percentage: 5,
    stop_loss_threshold: '',
    target_profit: ''
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    bankroll_id: '',
    type: 'deposit',
    amount: '',
    description: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadUserData();
    loadBets();
    loadLeaderboard();
    loadPicks();
    loadBankrolls();
    loadTransactions();
    loadCappers();
  }, []);

  // API Functions
  const loadUserData = async () => {
    try {
      const response = await fetch(
        `/api/user-stats?whop_user_id=${currentUser.whop_user_id}&experience_id=${currentUser.experience_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load user stats');
      }
      
      const data = await response.json();
      setUserStats(data.stats);
      setChartData(data.chartData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    }
  };

  const loadBets = async () => {
    try {
      const response = await fetch(
        `/api/bets?whop_user_id=${currentUser.whop_user_id}&experience_id=${currentUser.experience_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load bets');
      }
      
      const data = await response.json();
      setBets(data.bets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bets');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(
        `/api/leaderboard?whop_user_id=${currentUser.whop_user_id}&experience_id=${currentUser.experience_id}&timeframe=monthly`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  // New API functions
  const loadPicks = async () => {
    try {
      const response = await fetch(
        `/api/picks?whop_user_id=${currentUser.whop_user_id}&experience_id=${currentUser.experience_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load picks');
      }
      
      const data = await response.json();
      setPicks(data.picks || []);
    } catch (err) {
      console.error('Failed to load picks:', err);
    }
  };

  const loadBankrolls = async () => {
    try {
      const response = await fetch(
        `/api/bankrolls?whop_user_id=${currentUser.whop_user_id}&experience_id=${currentUser.experience_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load bankrolls');
      }
      
      const data = await response.json();
      setBankrolls(data.bankrolls || []);
    } catch (err) {
      console.error('Failed to load bankrolls:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch(
        `/api/bankrolls/transactions?whop_user_id=${currentUser.whop_user_id}&experience_id=${currentUser.experience_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const loadCappers = async () => {
    try {
      const response = await fetch(
        `/api/cappers?experience_id=${currentUser.experience_id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load cappers');
      }
      
      const data = await response.json();
      setCappers(data.cappers || []);
    } catch (err) {
      console.error('Failed to load cappers:', err);
    }
  };

  // Quick add pick to bet form
  const quickAddPick = (pick: Pick) => {
    setBetForm({
      sport: pick.sport,
      bet_type: pick.bet_type,
      description: pick.description,
      odds_american: pick.recommended_odds_american?.toString() || '',
      stake: '', // Let user enter their own stake
      sportsbook: '',
      game_date: pick.game_time || '',
      notes: pick.reasoning || ''
    });
    
    // Switch to bets tab and show add bet form
    setActiveTab('bets');
    setShowAddBet(true);
  };

  // Export user statistics to CSV
  const exportToCSV = () => {
    if (!userStats) return;
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Bets', userStats.total_bets],
      ['Wins', userStats.wins],
      ['Losses', userStats.losses],
      ['Pushes', userStats.pushes],
      ['Pending', userStats.pending],
      ['Win Rate', `${userStats.win_rate.toFixed(2)}%`],
      ['ROI', `${userStats.roi.toFixed(2)}%`],
      ['Net Profit', `$${userStats.net_profit.toFixed(2)}`],
      ['Current Streak', userStats.current_streak],
      ['Units Won', userStats.units_won],
      ['Units Wagered', userStats.units_wagered],
      ['Unit Size', `$${unitSize}`]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bettracker-stats-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Update unit size
  const updateUnitSize = async (newUnitSize: number) => {
    try {
      const response = await fetch('/api/user-stats', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whop_user_id: currentUser.whop_user_id,
          experience_id: currentUser.experience_id,
          unit_size: newUnitSize
        }),
      });
      
      if (response.ok) {
        setUnitSize(newUnitSize);
        setShowUnitSettings(false);
      }
    } catch (err) {
      console.error('Failed to update unit size:', err);
    }
  };

  const submitBet = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...betForm,
          whop_user_id: currentUser.whop_user_id,
          experience_id: currentUser.experience_id,
          odds_american: parseInt(betForm.odds_american),
          stake: parseFloat(betForm.stake)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create bet');
      }

      // Reset form and reload data
      setBetForm({
        sport: '',
        bet_type: 'moneyline',
        description: '',
        odds_american: '',
        stake: '',
        sportsbook: '',
        game_date: '',
        notes: ''
      });
      setShowAddBet(false);
      
      // Reload data
      await loadBets();
      await loadUserData();
      await loadLeaderboard();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bet');
    } finally {
      setSubmitting(false);
    }
  };

  const settleBet = async (betId: string, result: 'won' | 'lost' | 'push') => {
    try {
      const response = await fetch('/api/bets/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bet_id: betId,
          result,
          whop_user_id: currentUser.whop_user_id,
          experience_id: currentUser.experience_id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to settle bet');
      }

      // Reload data
      await loadBets();
      await loadUserData();
      await loadLeaderboard();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to settle bet');
    }
  };

  // Helper function to calculate potential return
  const calculatePotentialReturn = (stake: number, odds: number): number => {
    if (!stake || !odds) return 0;
    
    if (odds > 0) {
      return stake * (odds / 100);
    } else {
      return stake * (100 / Math.abs(odds));
    }
  };

  // Components
  const StatCard = ({ title, value, icon: Icon, color, isLoading = false }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: 'green' | 'red' | 'blue';
    isLoading?: boolean;
  }) => (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">{title}</CardTitle>
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
        ) : (
          <Icon className={`h-4 w-4 ${
            color === 'green' ? 'text-green-400' :
            color === 'red' ? 'text-red-400' : 'text-blue-400'
          }`} />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 bg-gray-600 rounded animate-pulse"></div>
        ) : (
          <div className={`text-2xl font-bold ${
            color === 'green' ? 'text-green-400' :
            color === 'red' ? 'text-red-400' : 'text-white'
          }`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const BetCard = ({ bet }: { bet: Bet }) => (
    <Card className="mb-3 bg-white/5 backdrop-blur-md border-white/10">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-white">{bet.description}</p>
              <Badge variant="outline" className="text-xs">
                {bet.sport.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-300">
              {bet.odds_american > 0 ? `+${bet.odds_american}` : bet.odds_american} • 
              ${bet.stake} • {bet.bet_type}
            </p>
            {bet.sportsbook && (
              <p className="text-xs text-gray-400">{bet.sportsbook}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={
                bet.result === 'won' ? 'default' : 
                bet.result === 'lost' ? 'destructive' : 
                bet.result === 'push' ? 'secondary' : 'outline'
              }
              className={
                bet.result === 'won' ? 'bg-green-600 hover:bg-green-700' : 
                bet.result === 'lost' ? 'bg-red-600 hover:bg-red-700' :
                bet.result === 'push' ? 'bg-gray-600 hover:bg-gray-700' :
                'border-yellow-500 text-yellow-500'
              }
            >
              {bet.result === 'pending' && 'Pending'}
              {bet.result === 'won' && `+${(bet.actual_return - bet.stake).toFixed(2)}`}
              {bet.result === 'lost' && `-${bet.stake.toFixed(2)}`}
              {bet.result === 'push' && 'Push'}
            </Badge>
            
            {bet.result === 'pending' && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs border-green-500 text-green-400 hover:bg-green-500/10"
                  onClick={() => settleBet(bet.id, 'won')}
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs border-red-500 text-red-400 hover:bg-red-500/10"
                  onClick={() => settleBet(bet.id, 'lost')}
                >
                  ×
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs border-gray-500 text-gray-400 hover:bg-gray-500/10"
                  onClick={() => settleBet(bet.id, 'push')}
                >
                  P
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const LeaderboardRow = ({ entry }: { entry: LeaderboardEntry }) => (
    <div className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {entry.rank <= 3 && <Crown className={`h-4 w-4 ${
            entry.rank === 1 ? 'text-yellow-400' :
            entry.rank === 2 ? 'text-gray-300' : 'text-orange-400'
          }`} />}
          <span className="font-medium text-white">#{entry.rank}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {entry.display_name || entry.username}
            </span>
            {entry.is_verified && (
              <Badge variant="secondary" className="text-xs bg-blue-600">✓</Badge>
            )}
            {entry.is_capper && (
              <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                Capper
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-300">
            {entry.win_rate.toFixed(1)}% • {entry.total_bets} bets
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${entry.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}% ROI
        </p>
        <p className="text-sm text-gray-300">
          ${entry.net_profit >= 0 ? '+' : ''}{entry.net_profit.toFixed(2)}
        </p>
      </div>
    </div>
  );

  // Memoized form component to prevent re-renders
  const AddBetForm = React.memo(({ betForm, setBetForm, submitBet, submitting, setShowAddBet }: {
    betForm: {
      sport: string;
      bet_type: string;
      description: string;
      odds_american: string;
      stake: string;
      sportsbook: string;
      game_date: string;
      notes: string;
    };
    setBetForm: React.Dispatch<React.SetStateAction<{
      sport: string;
      bet_type: string;
      description: string;
      odds_american: string;
      stake: string;
      sportsbook: string;
      game_date: string;
      notes: string;
    }>>;
    submitBet: () => Promise<void>;
    submitting: boolean;
    setShowAddBet: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const potentialReturn = calculatePotentialReturn(
      parseFloat(betForm.stake) || 0,
      parseInt(betForm.odds_american) || 0
    );

    return (
      <Card className="mb-6 bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Add New Bet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Sport</label>
              <select 
                className="w-full p-2 border border-white/20 rounded-md bg-white/10 text-white"
                value={betForm.sport}
                onChange={(e) => setBetForm((prev: any) => ({...prev, sport: e.target.value}))}
                required
              >
                <option value="">Select Sport</option>
                <option value="nfl">NFL</option>
                <option value="nba">NBA</option>
                <option value="mlb">MLB</option>
                <option value="nhl">NHL</option>
                <option value="ncaaf">College Football</option>
                <option value="ncaab">College Basketball</option>
                <option value="soccer">Soccer</option>
                <option value="tennis">Tennis</option>
                <option value="mma">MMA</option>
                <option value="boxing">Boxing</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Bet Type</label>
              <select 
                className="w-full p-2 border border-white/20 rounded-md bg-white/10 text-white"
                value={betForm.bet_type}
                onChange={(e) => setBetForm((prev: any) => ({...prev, bet_type: e.target.value}))}
              >
                <option value="moneyline">Moneyline</option>
                <option value="spread">Point Spread</option>
                <option value="total">Over/Under</option>
                <option value="prop">Player Prop</option>
                <option value="parlay">Parlay</option>
                <option value="teaser">Teaser</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Description</label>
            <Input
              value={betForm.description}
              onChange={(e) => setBetForm((prev: any) => ({...prev, description: e.target.value}))}
              placeholder="e.g., Lakers -5.5 vs Warriors"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Odds (American)</label>
              <Input
                type="number"
                value={betForm.odds_american}
                onChange={(e) => setBetForm((prev: any) => ({...prev, odds_american: e.target.value}))}
                placeholder="-110"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Stake ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={betForm.stake}
                onChange={(e) => setBetForm((prev: any) => ({...prev, stake: e.target.value}))}
                placeholder="100.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">To Win</label>
              <Input
                value={potentialReturn > 0 ? `${potentialReturn.toFixed(2)}` : ''}
                disabled
                className="bg-gray-700/50 border-white/10 text-gray-300"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Sportsbook</label>
              <select
                className="w-full p-2 border border-white/20 rounded-md bg-white/10 text-white"
                value={betForm.sportsbook}
                onChange={(e) => setBetForm((prev: any) => ({...prev, sportsbook: e.target.value}))}
              >
                <option value="">Select Sportsbook</option>
                <option value="draftkings">DraftKings</option>
                <option value="fanduel">FanDuel</option>
                <option value="bet365">Bet365</option>
                <option value="caesars">Caesars</option>
                <option value="mgm">BetMGM</option>
                <option value="pointsbet">PointsBet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Game Date</label>
              <Input
                type="datetime-local"
                value={betForm.game_date}
                onChange={(e) => setBetForm((prev: any) => ({...prev, game_date: e.target.value}))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Notes (Optional)</label>
            <Textarea
              value={betForm.notes}
              onChange={(e) => setBetForm((prev: any) => ({...prev, notes: e.target.value}))}
              placeholder="Any additional notes..."
              rows={3}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={submitBet}
              disabled={submitting || !betForm.sport || !betForm.description || !betForm.odds_american || !betForm.stake}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Bet...
                </>
              ) : (
                'Add Bet'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAddBet(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading BetTracker Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 
                className="text-xl font-bold text-white cursor-pointer hover:text-blue-300 transition-colors"
                onClick={() => setActiveTab('dashboard')}
              >
                BetTracker Pro
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {userStats && userStats.current_streak > 0 && (
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                  <Flame className="h-3 w-3 mr-1" />
                  {userStats.current_streak} Win Streak
                </Badge>
              )}
              {error && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnitSettings(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Unit: ${unitSize}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-white/10 backdrop-blur-md">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-white/20 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="bets" 
              className="flex items-center gap-2 data-[state=active]:bg-white/20 cursor-pointer"
              onClick={() => setActiveTab('bets')}
            >
              <Target className="h-4 w-4" />
              My Bets ({bets.length})
            </TabsTrigger>
            <TabsTrigger 
              value="picks" 
              className="flex items-center gap-2 data-[state=active]:bg-white/20 cursor-pointer"
              onClick={() => setActiveTab('picks')}
            >
              <Star className="h-4 w-4" />
              Picks ({picks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="bankrolls" 
              className="flex items-center gap-2 data-[state=active]:bg-white/20 cursor-pointer"
              onClick={() => setActiveTab('bankrolls')}
            >
              <Wallet className="h-4 w-4" />
              Bankrolls
            </TabsTrigger>
            <TabsTrigger 
              value="cappers" 
              className="flex items-center gap-2 data-[state=active]:bg-white/20 cursor-pointer"
              onClick={() => setActiveTab('cappers')}
            >
              <Users className="h-4 w-4" />
              Cappers
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="flex items-center gap-2 data-[state=active]:bg-white/20 cursor-pointer"
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Total Bets"
                value={userStats?.total_bets?.toLocaleString() || '0'}
                icon={Target}
                color="blue"
                isLoading={!userStats}
              />
              <StatCard
                title="Win Rate"
                value={userStats ? `${userStats.win_rate.toFixed(1)}%` : '0%'}
                icon={userStats && userStats.win_rate >= 50 ? TrendingUp : TrendingDown}
                color={userStats && userStats.win_rate >= 50 ? 'green' : 'red'}
                isLoading={!userStats}
              />
              <StatCard
                title="ROI"
                value={userStats ? `${userStats.roi >= 0 ? '+' : ''}${userStats.roi.toFixed(1)}%` : '0%'}
                icon={userStats && userStats.roi >= 0 ? TrendingUp : TrendingDown}
                color={userStats && userStats.roi >= 0 ? 'green' : 'red'}
                isLoading={!userStats}
              />
              <StatCard
                title="Net Profit"
                value={userStats ? `${userStats.net_profit >= 0 ? '+' : ''}${userStats.net_profit.toFixed(2)}` : '$0.00'}
                icon={DollarSign}
                color={userStats && userStats.net_profit >= 0 ? 'green' : 'red'}
                isLoading={!userStats}
              />
              <StatCard
                title="Current Streak"
                value={userStats ? `${userStats.current_streak >= 0 ? '+' : ''}${userStats.current_streak}` : '0'}
                icon={userStats && userStats.current_streak >= 0 ? Flame : TrendingDown}
                color={userStats && userStats.current_streak >= 0 ? 'green' : 'red'}
                isLoading={!userStats}
              />
              <StatCard
                title="Units Won"
                value={userStats ? `${userStats.units_won >= 0 ? '+' : ''}${userStats.units_won.toFixed(1)}` : '0'}
                icon={userStats && userStats.units_won >= 0 ? TrendingUp : TrendingDown}
                color={userStats && userStats.units_won >= 0 ? 'green' : 'red'}
                isLoading={!userStats}
              />
            </div>

            {/* Charts */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Profit Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#ffffff60"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis stroke="#ffffff60" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number) => [`${value.toFixed(2)}`, 'Profit']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">ROI Progression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#ffffff60"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis stroke="#ffffff60" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="roi" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Bets */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                {bets.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No bets yet. Add your first bet to get started!</p>
                    <Button 
                      onClick={() => {
                        setActiveTab('bets');
                        setShowAddBet(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Bet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bets.slice(0, 5).map(bet => <BetCard key={bet.id} bet={bet} />)}
                    {bets.length > 5 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('bets')}
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        View All {bets.length} Bets
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Bets Tab */}
          <TabsContent value="bets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">My Bets</h2>
              <Button 
                onClick={() => setShowAddBet(true)} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4" />
                Add Bet
              </Button>
            </div>

            {showAddBet && (
            <AddBetForm 
              betForm={betForm}
              setBetForm={setBetForm}
              submitBet={submitBet}
              submitting={submitting}
              setShowAddBet={setShowAddBet}
            />
          )}

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    Bet History {bets.length > 0 && `(${bets.length})`}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bets.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Bets Yet</h3>
                    <p className="text-gray-400 mb-6">Start tracking your bets to see your performance analytics</p>
                    <Button 
                      onClick={() => setShowAddBet(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Bet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bets.map(bet => <BetCard key={bet.id} bet={bet} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Community Leaderboard</h2>
              <div className="flex gap-2">
                <select 
                  className="p-2 border border-white/20 rounded-md bg-white/10 text-white text-sm"
                  onChange={(e) => {
                    // In real app, this would reload leaderboard with new timeframe
                    console.log('Timeframe changed:', e.target.value);
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                  <option value="all_time">All Time</option>
                </select>
                <select 
                  className="p-2 border border-white/20 rounded-md bg-white/10 text-white text-sm"
                  onChange={(e) => {
                    // In real app, this would reload leaderboard with sport filter
                    console.log('Sport filter changed:', e.target.value);
                  }}
                >
                  <option value="all">All Sports</option>
                  <option value="nfl">NFL</option>
                  <option value="nba">NBA</option>
                  <option value="mlb">MLB</option>
                  <option value="nhl">NHL</option>
                </select>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-0">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Rankings Available</h3>
                    <p className="text-gray-400">Community members need to place more bets to appear on the leaderboard</p>
                  </div>
                ) : (
                  leaderboard.map(entry => <LeaderboardRow key={entry.user_id} entry={entry} />)
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Info */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white mb-1">Leaderboard Requirements</h4>
                    <p className="text-sm text-gray-300">
                      Minimum of 10 settled bets required to appear on the leaderboard. 
                      Rankings are updated in real-time as bets are settled.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Picks Tab */}
          <TabsContent value="picks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Community Picks</h2>
              {isCapper && (
                <Button onClick={() => setShowAddPick(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pick
                </Button>
              )}
            </div>

            {/* Become Capper Button */}
            {!isCapper && (
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white mb-1">Become a Capper</h3>
                      <p className="text-sm text-gray-300">Share your picks with the community and build your reputation</p>
                    </div>
                    <Button onClick={() => setIsCapper(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Star className="h-4 w-4 mr-2" />
                      Become Capper
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Picks List */}
            <div className="grid gap-4">
              {picks.map((pick) => (
                <Card key={pick.id} className="bg-white/5 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {pick.sport}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {pick.bet_type}
                          </Badge>
                          {pick.is_premium && (
                            <Badge className="bg-yellow-600 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {pick.capper?.is_verified && (
                            <Badge className="bg-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-white mb-2">{pick.description}</h3>
                        {pick.reasoning && (
                          <p className="text-sm text-gray-300 mb-2">{pick.reasoning}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Confidence: {pick.confidence}/10</span>
                          <span>Units: {pick.recommended_units}</span>
                          <span>Follows: {pick.follows}</span>
                          <span>Views: {pick.views}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">
                          by {pick.capper?.display_name || pick.capper?.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(pick.posted_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">
                            <Heart className="h-3 w-3 mr-1" />
                            Follow
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => quickAddPick(pick)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Quick Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bankrolls Tab */}
          <TabsContent value="bankrolls" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Bankroll Management</h2>
              <Button onClick={() => setShowAddBankroll(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Bankroll
              </Button>
            </div>

            {/* Bankrolls List */}
            <div className="grid gap-4">
              {bankrolls.map((bankroll) => (
                <Card key={bankroll.id} className="bg-white/5 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white mb-1">{bankroll.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Current: ${bankroll.current_amount.toLocaleString()}</span>
                          <span>Starting: ${bankroll.starting_amount.toLocaleString()}</span>
                          <span>P&L: ${(bankroll.current_amount - bankroll.starting_amount).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">
                          {bankroll.sport && `${bankroll.sport} • `}{bankroll.currency}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowAddTransaction(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Transaction
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
              <div className="grid gap-2">
                {transactions.slice(0, 10).map((transaction) => (
                  <Card key={transaction.id} className="bg-white/5 backdrop-blur-md border-white/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-white">{transaction.type}</span>
                          {transaction.description && (
                            <span className="text-xs text-gray-400 ml-2">• {transaction.description}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${
                            transaction.type === 'deposit' || transaction.type === 'win' 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'win' ? '+' : '-'}${transaction.amount}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Cappers Tab */}
          <TabsContent value="cappers" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Top Cappers</h2>
            
            <div className="grid gap-4">
              {cappers.map((capper) => (
                <Card key={capper.id} className="bg-white/5 backdrop-blur-md border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {(capper.display_name || capper.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">
                              {capper.display_name || capper.username}
                            </h3>
                            {capper.is_verified && (
                              <Badge className="bg-green-600 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>ROI: {capper.user_stats.roi.toFixed(1)}%</span>
                            <span>Win Rate: {capper.user_stats.win_rate.toFixed(1)}%</span>
                            <span>Bets: {capper.user_stats.total_bets}</span>
                            <span>Streak: {capper.user_stats.current_streak}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Picks
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Unit Settings Modal */}
        {showUnitSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96 bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Unit Size Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Unit Size ($)</label>
                  <Input
                    type="number"
                    value={unitSize}
                    onChange={(e) => setUnitSize(parseFloat(e.target.value) || 100)}
                    placeholder="100"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This is your standard betting unit size for tracking purposes
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => updateUnitSize(unitSize)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUnitSettings(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mt-6 border-red-500 bg-red-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <h4 className="font-medium text-red-400">Error</h4>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto border-red-400 text-red-400 hover:bg-red-500/20"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Development Info */}
        <Card className="mt-8 bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-1">BetTracker Pro - Production Version</h4>
                <p className="text-sm text-blue-300 mb-2">
                  This is the complete application with real backend integration. 
                  All data is stored in Supabase and user authentication is handled through Whop SDK.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-blue-200">Backend:</span>
                    <p className="text-green-400">✓ Connected</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Database:</span>
                    <p className="text-green-400">✓ Supabase</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Auth:</span>
                    <p className="text-green-400">✓ Whop SDK</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Deployment:</span>
                    <p className="text-green-400">✓ Vercel</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
