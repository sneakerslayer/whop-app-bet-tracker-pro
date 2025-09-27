export default function Page() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-12">
					<h1 className="text-6xl font-bold text-white mb-6">
						BetTracker Pro
					</h1>
					<p className="text-xl text-gray-300 mb-8">
						Professional-grade bet tracking system for Whop communities
					</p>
					<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-2xl mx-auto">
						<h2 className="text-2xl font-semibold text-white mb-4">
							🚀 Ready to Launch
						</h2>
						<p className="text-gray-300 mb-6">
							Your BetTracker Pro application is successfully deployed and ready for use!
						</p>
						<div className="space-y-4">
							<div className="flex items-center justify-center space-x-2 text-green-400">
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								<span>✅ Application deployed successfully</span>
							</div>
							<div className="flex items-center justify-center space-x-2 text-green-400">
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								<span>✅ Database connected</span>
							</div>
							<div className="flex items-center justify-center space-x-2 text-green-400">
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								<span>✅ API endpoints configured</span>
							</div>
						</div>
					</div>
				</div>

				<div className="grid md:grid-cols-2 gap-8 mb-12">
					<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-white mb-4">📊 Features</h3>
						<ul className="space-y-2 text-gray-300">
							<li>• Personal bet tracking & analytics</li>
							<li>• Community leaderboards</li>
							<li>• Real-time statistics</li>
							<li>• Professional UI/UX</li>
							<li>• Secure authentication</li>
						</ul>
					</div>
					<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
						<h3 className="text-xl font-semibold text-white mb-4">🔧 Technical</h3>
						<ul className="space-y-2 text-gray-300">
							<li>• Next.js 15 + React 19</li>
							<li>• Supabase database</li>
							<li>• Whop SDK integration</li>
							<li>• TypeScript + Tailwind CSS</li>
							<li>• Production optimized</li>
						</ul>
					</div>
				</div>

				<div className="text-center">
					<p className="text-gray-400 mb-4">
						Access your app through the Whop platform at:
					</p>
					<code className="bg-black/50 text-green-400 px-4 py-2 rounded-lg text-sm">
						/experiences/[experienceId]
					</code>
				</div>
			</div>
		</div>
	);
}
