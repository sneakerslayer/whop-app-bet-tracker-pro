# BetTracker Pro - Row Level Security (RLS) Implementation Guide

## Overview

This guide explains how to implement Row Level Security (RLS) policies for BetTracker Pro to ensure proper multi-tenant data isolation at the database level. RLS provides an additional layer of security beyond application-level filtering.

## What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access in database tables. It ensures that users can only see and modify data they're authorized to access, even if they bypass the application layer.

## Implementation Steps

### Step 1: Apply RLS Policies to Supabase

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the RLS Policies Script**
   - Copy the contents of `supabase-rls-policies.sql`
   - Paste and execute the script in the SQL Editor
   - This will:
     - Enable RLS on all tables
     - Create policies for each table
     - Add helper functions for context management

### Step 2: Verify RLS Implementation

After running the script, verify that RLS is enabled:

```sql
-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'bets', 'picks', 'bankrolls', 'transactions', 'user_stats', 'community_settings', 'pick_follows', 'leaderboard_cache');
```

All tables should show `rowsecurity = true`.

### Step 3: Test RLS Policies

Test the policies with sample data:

```sql
-- Test user context setting
SELECT set_user_context('test_user_123', 'test_experience_456');

-- Test that users can only see their own data
SELECT * FROM users WHERE whop_user_id = 'test_user_123';

-- Clear context
SELECT clear_user_context();
```

## RLS Policy Architecture

### Multi-Tenant Isolation Strategy

The RLS policies implement a **two-layer security model**:

1. **Experience-Level Isolation**: All data is scoped to `whop_experience_id`
2. **User-Level Isolation**: Users can only access their own data within their experience

### Policy Categories

#### 1. User-Specific Data (Private)
- **Tables**: `users`, `bets`, `bankrolls`, `transactions`, `user_stats`, `pick_follows`
- **Policy**: Users can only access their own records within their experience
- **Example**: User A in Experience 1 cannot see User B's bets, even if User B is also in Experience 1

#### 2. Community-Shared Data (Public within Experience)
- **Tables**: `picks`, `community_settings`, `leaderboard_cache`
- **Policy**: All users in an experience can view, but only authorized users can modify
- **Example**: All users in Experience 1 can see picks from cappers in Experience 1

#### 3. System-Managed Data
- **Tables**: `user_stats`, `leaderboard_cache`
- **Policy**: System can manage, users can only view their own
- **Example**: System updates user stats, users can only view their own stats

## API Integration

### Updated Supabase Client

The `lib/supabase.ts` file now includes helper functions:

```typescript
// Set RLS context before database operations
await setRLSContext(userId, experienceId);

// Clear context after operations (optional)
await clearRLSContext();
```

### API Route Updates

All API routes now call `setRLSContext()` before database operations:

```typescript
// Example from user-stats route
export async function GET(request: NextRequest) {
  const whop_user_id = searchParams.get('whop_user_id');
  const experience_id = searchParams.get('experience_id');
  
  // Set RLS context for multi-tenant security
  await setRLSContext(whop_user_id, experience_id);
  
  // Database operations are now automatically filtered by RLS
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('whop_user_id', whop_user_id)
    .single();
}
```

## Security Benefits

### 1. Defense in Depth
- **Application Level**: API routes validate `experience_id` and `whop_user_id`
- **Database Level**: RLS policies enforce the same restrictions
- **Result**: Even if application logic fails, database prevents unauthorized access

### 2. Data Leakage Prevention
- **Cross-Experience Leaks**: Users cannot access data from other Whop experiences
- **Cross-User Leaks**: Users cannot access other users' private data
- **SQL Injection Protection**: RLS policies prevent data exposure even with malicious queries

### 3. Compliance & Auditing
- **Data Isolation**: Clear separation between different communities
- **Access Logging**: Supabase can log all access attempts
- **Policy Transparency**: Security rules are explicit and auditable

## Testing RLS Policies

### 1. Positive Tests (Should Work)
```sql
-- Set context for user in experience
SELECT set_user_context('user_123', 'exp_456');

-- These should return data:
SELECT * FROM users WHERE whop_user_id = 'user_123';
SELECT * FROM bets WHERE user_id IN (SELECT id FROM users WHERE whop_user_id = 'user_123');
SELECT * FROM picks WHERE whop_experience_id = 'exp_456';
```

### 2. Negative Tests (Should Fail)
```sql
-- Set context for different user
SELECT set_user_context('user_789', 'exp_456');

-- These should return empty results:
SELECT * FROM users WHERE whop_user_id = 'user_123';  -- Different user
SELECT * FROM bets WHERE user_id IN (SELECT id FROM users WHERE whop_user_id = 'user_123');
```

### 3. Cross-Experience Tests (Should Fail)
```sql
-- Set context for different experience
SELECT set_user_context('user_123', 'exp_999');

-- These should return empty results:
SELECT * FROM users WHERE whop_user_id = 'user_123';  -- Different experience
SELECT * FROM picks WHERE whop_experience_id = 'exp_456';  -- Different experience
```

## Troubleshooting

### Common Issues

1. **RLS Context Not Set**
   - **Error**: Empty results even with valid queries
   - **Solution**: Ensure `setRLSContext()` is called before database operations

2. **Policy Conflicts**
   - **Error**: Unexpected access denied errors
   - **Solution**: Check policy logic and ensure context is set correctly

3. **Performance Impact**
   - **Issue**: Queries slower with RLS enabled
   - **Solution**: Add indexes on `whop_experience_id` and `whop_user_id` columns

### Debugging RLS Policies

```sql
-- Check current context
SELECT current_setting('app.current_user_id', true) as current_user_id,
       current_setting('app.current_experience_id', true) as current_experience_id;

-- List all policies on a table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';
```

## Production Deployment

### 1. Pre-Deployment Checklist
- [ ] RLS policies applied to all tables
- [ ] Helper functions created (`set_user_context`, `clear_user_context`)
- [ ] API routes updated to use `setRLSContext()`
- [ ] RLS policies tested with sample data
- [ ] Performance impact assessed

### 2. Monitoring
- Monitor query performance with RLS enabled
- Check Supabase logs for access denied errors
- Verify data isolation between experiences

### 3. Rollback Plan
If issues arise, RLS can be temporarily disabled:

```sql
-- Disable RLS on specific table (emergency only)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Best Practices

1. **Always Set Context**: Call `setRLSContext()` before any database operation
2. **Test Thoroughly**: Verify policies work correctly with test data
3. **Monitor Performance**: RLS can impact query performance
4. **Document Changes**: Keep track of policy modifications
5. **Regular Audits**: Periodically review and test RLS policies

## Conclusion

RLS policies provide an essential security layer for multi-tenant applications. When combined with application-level validation, they create a robust defense against data leakage and unauthorized access. The implementation ensures that each Whop community's data remains completely isolated while maintaining the flexibility needed for community-shared features like picks and leaderboards.
