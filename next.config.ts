import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	// Production optimizations
	compiler: {
		// Remove console.log in production
		removeConsole: process.env.NODE_ENV === "production",
	},
	// Enable experimental features for better performance
	experimental: {
		optimizePackageImports: ['lucide-react', 'recharts'],
	},
	// Optimize bundle size
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
			};
		}
		return config;
	},
	// Enable compression
	compress: true,
	// Optimize images
	images: {
		remotePatterns: [{ hostname: "**" }],
		formats: ['image/webp', 'image/avif'],
	},
	// Security headers
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'origin-when-cross-origin',
					},
				],
			},
		];
	},
};

export default withWhopAppConfig(nextConfig);
