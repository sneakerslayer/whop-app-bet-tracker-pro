import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import BetTrackerPro from "@/components/BetTrackerPro";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	// The user token is in the headers
	const { userId } = await whopSdk.verifyUserToken(headersList);

	const result = await whopSdk.access.checkIfUserHasAccessToExperience({
		userId,
		experienceId,
	});

	const user = await whopSdk.users.getUser({ userId });
	const experience = await whopSdk.experiences.getExperience({ experienceId });

	// Either: 'admin' | 'customer' | 'no_access';
	// 'admin' means the user is an admin of the whop, such as an owner or moderator
	// 'customer' means the user is a common member in this whop
	// 'no_access' means the user does not have access to the whop
	const { accessLevel } = result;

	// Check if user has access
	if (!result.hasAccess) {
		return (
			<div className="flex justify-center items-center h-screen px-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
					<p className="text-gray-600">
						You do not have access to this experience. Your access level is: <strong>{accessLevel}</strong>
					</p>
				</div>
			</div>
		);
	}

	// Render BetTracker Pro for users with access
	return <BetTrackerPro userId={userId} experienceId={experienceId} />;
}
