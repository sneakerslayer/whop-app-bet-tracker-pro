# BetTracker Pro - Community Onboarding Guide

## Welcome to BetTracker Pro! 🎯

This guide will walk you through implementing BetTracker Pro in your Whop community. The entire process takes about **30-45 minutes** and requires no technical expertise.

## What is BetTracker Pro?

BetTracker Pro is a professional-grade bet tracking system that transforms your community into a transparent, analytics-driven betting environment. It features:

- **Personal Analytics**: Track individual performance with detailed statistics
- **Community Leaderboards**: Foster healthy competition with transparent rankings
- **Pick Sharing**: Allow verified cappers to share their picks with the community
- **Bankroll Management**: Professional bankroll tracking with multiple currencies
- **Real-time Updates**: Live tracking of bets and results
- **Multi-tenant Security**: Complete data isolation between communities

## Prerequisites

Before starting, ensure you have:
- ✅ A Whop community with admin access
- ✅ A Whop developer account (free)
- ✅ Basic understanding of your community's betting rules
- ✅ 30-45 minutes for setup

## Step-by-Step Implementation

### Step 1: Create Your Whop App (5 minutes)

1. **Access Whop Developer Dashboard**
   - Go to [https://whop.com/dashboard/developer/](https://whop.com/dashboard/developer/)
   - Sign in with your Whop account

2. **Create New App**
   - Click "Create App"
   - Choose "Custom App"
   - Name: `BetTracker Pro - [Your Community Name]`
   - Description: `Professional bet tracking system for [Your Community Name]`

3. **Configure App Settings**
   - **App Path**: `/experiences/[experienceId]`
   - **Dashboard Path**: `/dashboard/[companyId]`
   - **Discover Path**: `/discover`
   - **Base URL**: `https://bet-tracker-pro.vercel.app` (or your custom domain)

4. **Get Your Credentials**
   - Copy and save these values (you'll need them later):
     - **App ID**: `app_xxxxxxxxxx`
     - **API Key**: `whop_xxxxxxxxxx`
     - **Agent User ID**: `user_xxxxxxxxxx`

### Step 2: Set Up Supabase Database (10 minutes)

1. **Create Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Configure Your Project**
   - **Project Name**: `BetTracker Pro - [Your Community Name]`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your community

3. **Get Database Credentials**
   - Go to Settings → API
   - Copy and save:
     - **Project URL**: `https://xxxxxxxxxx.supabase.co`
     - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Set Up Database Tables**
   - Go to SQL Editor in Supabase
   - Copy the contents of `supabase-rls-policies.sql` from the project
   - Paste and execute the script
   - This creates all necessary tables and security policies

### Step 3: Deploy the Application (5 minutes)

1. **Fork the Repository**
   - Go to the BetTracker Pro GitHub repository
   - Click "Fork" to create your own copy

2. **Deploy to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your forked repository

3. **Configure Environment Variables**
   In Vercel, add these environment variables:
   ```
   NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxx
   WHOP_API_KEY=whop_xxxxxxxxxx
   NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_xxxxxxxxxx
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your deployment URL (e.g., `https://bet-tracker-pro-abc123.vercel.app`)

### Step 4: Configure Your Whop App (5 minutes)

1. **Update App Settings**
   - Return to your Whop Developer Dashboard
   - Go to your app's settings
   - Update **Base URL** to your Vercel deployment URL
   - Save changes

2. **Add App to Your Community**
   - Go to your Whop community dashboard
   - Navigate to "Tools" or "Apps"
   - Click "Add App"
   - Select your BetTracker Pro app
   - Configure access permissions

### Step 5: Initial Community Configuration (10 minutes)

1. **Access Your App**
   - Go to your community's experience page
   - Click on the BetTracker Pro app
   - You should see the main dashboard

2. **Configure Community Settings**
   - Navigate to Admin → Community Settings
   - Set up your community's betting rules:
     - **Default Unit Size**: Recommended starting amount
     - **Minimum Bet Amount**: Smallest allowed bet
     - **Enable Photo Verification**: Require screenshots for bets
     - **Leaderboard Requirements**: Minimum bets for ranking
     - **Featured Timeframe**: Monthly, weekly, or all-time

3. **Set Up Discord Integration** (Optional)
   - **Discord Webhook URL**: For bet notifications
   - **Channel ID**: Where notifications will be sent
   - **Enable Notifications**: Pick notifications, result notifications

4. **Configure Capper System** (Optional)
   - **Require Capper Verification**: Manual approval for pick sharing
   - **Enable Premium Picks**: Paid picks for verified cappers
   - **Revenue Share**: Percentage for community revenue

### Step 6: Test Your Implementation (5 minutes)

1. **Create Test User**
   - Use a different account or ask a community member
   - Access the app through your community
   - Verify access control is working

2. **Test Core Features**
   - **Add a Test Bet**: Create a sample bet
   - **Check Leaderboard**: Verify rankings work
   - **Test Pick Sharing**: If you have cappers, test pick creation
   - **Verify Data Isolation**: Ensure users only see their own data

3. **Admin Functions**
   - **Settle Bets**: Test bet settlement
   - **Manage Cappers**: Test capper approval
   - **View Analytics**: Check community statistics

## Post-Setup Configuration

### Community Guidelines Setup

1. **Create Betting Rules Document**
   - Document your community's betting guidelines
   - Include minimum bet amounts, verification requirements
   - Share with community members

2. **Train Community Moderators**
   - Show moderators how to settle bets
   - Explain capper approval process
   - Review reporting and analytics features

3. **Announce to Community**
   - Create announcement about BetTracker Pro
   - Explain benefits and features
   - Provide onboarding instructions for members

### Advanced Configuration

1. **Custom Branding** (Optional)
   - Update app colors to match your community
   - Add custom logos and images
   - Modify welcome messages

2. **Integration Setup**
   - Configure Discord webhooks for notifications
   - Set up automated bet reminders
   - Configure result notifications

3. **Analytics and Reporting**
   - Set up regular community performance reports
   - Configure leaderboard reset schedules
   - Plan community challenges and competitions

## Troubleshooting

### Common Issues

**App Not Loading**
- ✅ Check that Base URL is correct in Whop app settings
- ✅ Verify environment variables are set in Vercel
- ✅ Ensure app is deployed successfully

**Database Connection Errors**
- ✅ Verify Supabase credentials are correct
- ✅ Check that RLS policies were applied
- ✅ Ensure database tables exist

**Users Can't Access App**
- ✅ Verify app is added to your community
- ✅ Check user permissions in Whop
- ✅ Ensure experience ID is correct

**Data Not Showing**
- ✅ Check that RLS context is being set
- ✅ Verify user has proper access level
- ✅ Check browser console for errors

### Getting Help

1. **Check Documentation**
   - Review `RLS-IMPLEMENTATION-GUIDE.md` for technical details
   - Check API documentation for advanced features

2. **Community Support**
   - Join the BetTracker Pro Discord community
   - Ask questions in the support channel
   - Share your implementation experience

3. **Technical Support**
   - For urgent issues, contact support
   - Include your community name and error details
   - Provide screenshots of any error messages

## Best Practices

### Community Management

1. **Regular Monitoring**
   - Check daily for new bets and picks
   - Monitor leaderboard activity
   - Review community analytics weekly

2. **User Engagement**
   - Announce weekly/monthly winners
   - Create betting challenges and competitions
   - Highlight top performers

3. **Data Maintenance**
   - Regularly settle pending bets
   - Clean up old or invalid data
   - Monitor for suspicious activity

### Security Considerations

1. **Access Control**
   - Regularly review user permissions
   - Monitor for unauthorized access attempts
   - Keep admin credentials secure

2. **Data Privacy**
   - Ensure users understand data usage
   - Comply with privacy regulations
   - Regular security audits

## Success Metrics

Track these metrics to measure success:

- **User Adoption**: Number of active users
- **Engagement**: Bets placed per user per week
- **Community Growth**: New members joining
- **Capper Activity**: Number of picks shared
- **Revenue**: Community earnings from premium picks

## Next Steps

After successful implementation:

1. **Week 1**: Monitor usage and gather feedback
2. **Week 2**: Optimize settings based on community needs
3. **Month 1**: Analyze performance and plan improvements
4. **Ongoing**: Regular updates and feature enhancements

## Support and Resources

- **Documentation**: Complete technical documentation available
- **Community**: Join our Discord for support and updates
- **Updates**: Regular feature updates and improvements
- **Training**: Available for community administrators

---

## Quick Reference

### Essential URLs
- **Whop Developer Dashboard**: https://whop.com/dashboard/developer/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

### Key Credentials Needed
- Whop App ID
- Whop API Key
- Whop Agent User ID
- Supabase Project URL
- Supabase Anon Key

### Deployment Checklist
- [ ] Whop app created and configured
- [ ] Supabase project set up with tables
- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] App added to community
- [ ] Community settings configured
- [ ] Test users verified
- [ ] Community announcement made

---

**Congratulations!** 🎉 You've successfully implemented BetTracker Pro for your community. Your members now have access to professional-grade bet tracking and analytics that will enhance their betting experience and foster healthy competition.

For ongoing support and updates, join our community Discord and stay tuned for new features and improvements!
