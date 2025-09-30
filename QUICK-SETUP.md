# BetTracker Pro - Quick Setup Reference

## 🚀 30-Minute Setup Checklist

### Step 1: Whop App Setup (5 min)
- [ ] Create app at https://whop.com/dashboard/developer/
- [ ] Set paths: `/experiences/[experienceId]`, `/dashboard/[companyId]`, `/discover`
- [ ] Save credentials: App ID, API Key, Agent User ID

### Step 2: Database Setup (10 min)
- [ ] Create Supabase project at https://supabase.com
- [ ] Run `supabase-rls-policies.sql` in SQL Editor
- [ ] Save credentials: Project URL, Anon Key

### Step 3: Deploy App (5 min)
- [ ] Fork repository and deploy to Vercel
- [ ] Add environment variables in Vercel
- [ ] Note deployment URL

### Step 4: Configure App (5 min)
- [ ] Update Base URL in Whop app settings
- [ ] Add app to your community
- [ ] Test access

### Step 5: Community Setup (5 min)
- [ ] Configure community settings
- [ ] Set betting rules and limits
- [ ] Test with sample data

## 🔑 Required Credentials

```
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxx
WHOP_API_KEY=whop_xxxxxxxxxx
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_xxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛠️ Essential URLs

- **Whop Developer**: https://whop.com/dashboard/developer/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

## ⚡ Quick Test

1. Access app through your community
2. Add a test bet
3. Check leaderboard
4. Verify data isolation

## 🆘 Common Issues

**App won't load**: Check Base URL and environment variables
**Database errors**: Verify Supabase credentials and RLS policies
**Access denied**: Check app permissions in Whop community

## 📞 Support

- Full guide: `ONBOARDING-GUIDE.md`
- Technical docs: `RLS-IMPLEMENTATION-GUIDE.md`
- Community Discord: [Join for support]

---
**Total Setup Time: ~30 minutes** ⏱️
