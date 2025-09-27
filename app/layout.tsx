import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "BetTracker Pro - Professional Bet Tracking",
	description: "The first professional-grade bet tracking system designed specifically for Whop communities. Track your bets, analyze performance, and compete on community leaderboards.",
	keywords: ["betting", "sports betting", "analytics", "tracking", "whop", "community"],
	authors: [{ name: "BetTracker Pro" }],
	viewport: "width=device-width, initial-scale=1",
	robots: "noindex, nofollow", // Private app, don't index
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<WhopApp>{children}</WhopApp>
			</body>
		</html>
	);
}
