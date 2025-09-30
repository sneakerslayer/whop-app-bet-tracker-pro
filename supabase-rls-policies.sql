-- BetTracker Pro - Row Level Security (RLS) Policies
-- This file contains RLS policies for multi-tenant data isolation
-- Each policy ensures users can only access data within their Whop experience

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- USERS TABLE POLICIES
-- ==============================================

-- Users can view their own profile within their experience
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        whop_user_id = current_setting('app.current_user_id', true)::text
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- Users can update their own profile within their experience
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        whop_user_id = current_setting('app.current_user_id', true)::text
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- System can insert new users (for user creation)
CREATE POLICY "System can insert users" ON users
    FOR INSERT WITH CHECK (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- ==============================================
-- BETS TABLE POLICIES
-- ==============================================

-- Users can view their own bets within their experience
CREATE POLICY "Users can view own bets" ON bets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- Users can insert their own bets within their experience
CREATE POLICY "Users can insert own bets" ON bets
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- Users can update their own bets within their experience
CREATE POLICY "Users can update own bets" ON bets
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- Users can delete their own bets within their experience
CREATE POLICY "Users can delete own bets" ON bets
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- ==============================================
-- PICKS TABLE POLICIES
-- ==============================================

-- Users can view picks within their experience
CREATE POLICY "Users can view picks in experience" ON picks
    FOR SELECT USING (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- Users can insert picks within their experience (for cappers)
CREATE POLICY "Users can insert picks in experience" ON picks
    FOR INSERT WITH CHECK (
        capper_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- Users can update their own picks within their experience
CREATE POLICY "Users can update own picks" ON picks
    FOR UPDATE USING (
        capper_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- ==============================================
-- BANKROLLS TABLE POLICIES
-- ==============================================

-- Users can view their own bankrolls within their experience
CREATE POLICY "Users can view own bankrolls" ON bankrolls
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can insert their own bankrolls
CREATE POLICY "Users can insert own bankrolls" ON bankrolls
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can update their own bankrolls
CREATE POLICY "Users can update own bankrolls" ON bankrolls
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can delete their own bankrolls
CREATE POLICY "Users can delete own bankrolls" ON bankrolls
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- ==============================================
-- TRANSACTIONS TABLE POLICIES
-- ==============================================

-- Users can view their own transactions within their experience
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- ==============================================
-- USER_STATS TABLE POLICIES
-- ==============================================

-- Users can view their own stats within their experience
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
        AND whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- System can insert/update user stats
CREATE POLICY "System can manage user stats" ON user_stats
    FOR ALL USING (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- ==============================================
-- COMMUNITY_SETTINGS TABLE POLICIES
-- ==============================================

-- Users can view community settings within their experience
CREATE POLICY "Users can view community settings" ON community_settings
    FOR SELECT USING (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- System can manage community settings
CREATE POLICY "System can manage community settings" ON community_settings
    FOR ALL USING (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- ==============================================
-- PICK_FOLLOWS TABLE POLICIES
-- ==============================================

-- Users can view their own pick follows within their experience
CREATE POLICY "Users can view own pick follows" ON pick_follows
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can insert their own pick follows
CREATE POLICY "Users can insert own pick follows" ON pick_follows
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- Users can delete their own pick follows
CREATE POLICY "Users can delete own pick follows" ON pick_follows
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE whop_user_id = current_setting('app.current_user_id', true)::text
            AND whop_experience_id = current_setting('app.current_experience_id', true)::text
        )
    );

-- ==============================================
-- LEADERBOARD_CACHE TABLE POLICIES
-- ==============================================

-- Users can view leaderboard cache within their experience
CREATE POLICY "Users can view leaderboard cache" ON leaderboard_cache
    FOR SELECT USING (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- System can manage leaderboard cache
CREATE POLICY "System can manage leaderboard cache" ON leaderboard_cache
    FOR ALL USING (
        whop_experience_id = current_setting('app.current_experience_id', true)::text
    );

-- ==============================================
-- HELPER FUNCTIONS FOR SETTING CONTEXT
-- ==============================================

-- Function to set current user context for RLS policies
CREATE OR REPLACE FUNCTION set_user_context(user_id text, experience_id text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
    PERFORM set_config('app.current_experience_id', experience_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user context
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_experience_id', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
