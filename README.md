# BetTracker Pro - Professional Bet Tracking for Whop Communities

BetTracker Pro is a comprehensive bet tracking system designed specifically for Whop communities. It combines personal analytics with transparent community leaderboards, transforming betting chaos into credible, data-driven insights.

## 🎯 Features

- **Personal Analytics**: Track individual performance with detailed statistics
- **Community Leaderboards**: Foster healthy competition with transparent rankings  
- **Pick Sharing**: Allow verified cappers to share their picks with the community
- **Bankroll Management**: Professional bankroll tracking with multiple currencies
- **Multi-tenant Security**: Complete data isolation between communities
- **Real-time Updates**: Live tracking of bets and results
- **Discord Integration**: Automated notifications and updates

## 🚀 Quick Start

### For Community Administrators

**30-Minute Setup Process:**

1. **[Quick Setup Guide](QUICK-SETUP.md)** - Essential checklist for fast deployment
2. **[Complete Onboarding Guide](ONBOARDING-GUIDE.md)** - Comprehensive step-by-step instructions
3. **[Technical Implementation Guide](RLS-IMPLEMENTATION-GUIDE.md)** - Advanced security and configuration

### For Developers

**Development Setup:**

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Whop and Supabase credentials

# Run development server
pnpm dev
```

## 📋 Implementation Process

### Step 1: Whop App Setup (5 minutes)
- Create app in [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
- Configure paths: `/experiences/[experienceId]`, `/dashboard/[companyId]`, `/discover`
- Save credentials: App ID, API Key, Agent User ID

### Step 2: Database Setup (10 minutes)
- Create [Supabase](https://supabase.com) project
- Run `supabase-rls-policies.sql` in SQL Editor
- Save credentials: Project URL, Anon Key

### Step 3: Deploy Application (5 minutes)
- Fork repository and deploy to [Vercel](https://vercel.com)
- Configure environment variables
- Deploy and note URL

### Step 4: Configure App (5 minutes)
- Update Base URL in Whop app settings
- Add app to your community
- Test access and permissions

### Step 5: Community Configuration (5 minutes)
- Configure community settings and betting rules
- Set up Discord integration (optional)
- Test core functionality

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level data isolation
- **Multi-tenant Architecture**: Complete separation between communities
- **Authentication**: Whop SDK integration with proper access control
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Protection**: RLS policies prevent data leaks

## 📊 Multi-Tenancy

Each Whop community gets:
- **Isolated Data**: Users, bets, stats completely separated
- **Custom Settings**: Community-specific configuration
- **Independent Leaderboards**: Rankings per community
- **Secure Access**: Users can only access their community's data

## 🛠️ Technical Stack

- **Frontend**: Next.js 15.3.2 with React 19
- **Backend**: Whop SDK integration with API routes
- **Database**: Supabase with PostgreSQL
- **Authentication**: Whop SDK
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom components

## 📁 Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── experiences/       # Main app pages
│   └── dashboard/         # Admin dashboard
├── components/            # React components
│   ├── BetTrackerPro.tsx # Main application component
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── supabase.ts       # Database client with RLS
│   └── whop-sdk.ts       # Whop SDK configuration
└── docs/                  # Documentation
    ├── ONBOARDING-GUIDE.md
    ├── QUICK-SETUP.md
    └── RLS-IMPLEMENTATION-GUIDE.md
```

## 🔧 Environment Variables

```bash
# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxx
WHOP_API_KEY=whop_xxxxxxxxxx
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_xxxxxxxxxx

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 Documentation

- **[Onboarding Guide](ONBOARDING-GUIDE.md)** - Complete setup instructions
- **[Quick Setup](QUICK-SETUP.md)** - 30-minute deployment checklist
- **[RLS Implementation](RLS-IMPLEMENTATION-GUIDE.md)** - Security and technical details
- **[API Documentation](docs/API.md)** - API endpoints and usage

## 🆘 Support

- **Community Discord**: Join for support and updates
- **Documentation**: Comprehensive guides for all skill levels
- **Technical Support**: Available for implementation issues

## 🎉 Success Stories

BetTracker Pro is trusted by communities worldwide for:
- **Transparent Analytics**: Clear performance tracking
- **Community Engagement**: Increased member participation
- **Professional Standards**: Enterprise-grade security and reliability
- **Easy Management**: Simple administration and monitoring

## 📈 What's Next

- Regular feature updates and improvements
- Enhanced analytics and reporting
- Additional integrations and customizations
- Community-driven feature development

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

**Ready to transform your community's betting experience?** 

Start with our [Quick Setup Guide](QUICK-SETUP.md) and have BetTracker Pro running in your community in just 30 minutes! 🚀
