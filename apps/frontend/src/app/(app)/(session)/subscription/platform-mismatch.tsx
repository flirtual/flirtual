"use client";

import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";

import type { FC, PropsWithChildren } from "react";

export const PlatformMismatchMessage: FC = () => {
	const { platform, native } = useDevice();
	const [session] = useSession();

	if (!session) return null;
	const { subscription } = session.user;

	if (
		!subscription ||
		!subscription.active ||
		subscription.platform === "unknown" ||
		(["stripe", "chargebee"].includes(subscription.platform) &&
			(platform === "web" || !native)) ||
		(subscription.platform === "ios" && platform === "apple" && native) ||
		(subscription.platform === "android" && platform === "android" && native)
	)
		return null;

	return (
		<div className="rounded-lg bg-brand-gradient px-6 py-4">
			<span className="font-montserrat text-lg text-white-10">
				Sorry, you can&apos;t make changes to this subscription{" "}
				{platform === "apple" ? (
					<>
						in the <span className="font-semibold">iOS</span> app
					</>
				) : platform === "android" ? (
					<>
						in the <span className="font-semibold">Android</span> app
					</>
				) : (
					<>
						on the <span className="font-semibold">website</span>
					</>
				)}
				. Please use the{" "}
				{subscription.platform === "ios" ? (
					<>
						<span className="font-semibold">iOS</span> app
					</>
				) : subscription.platform === "android" ? (
					<>
						<span className="font-semibold">Android</span> app
					</>
				) : (
					<span className="font-semibold">website</span>
				)}{" "}
				to manage your subscription.
			</span>
		</div>
	);
};

export const MatchSubscriptionPlatform: FC<PropsWithChildren> = ({
	children
}) => {
	const { platform, native } = useDevice();
	const [session] = useSession();

	if (!session) return children;
	const { subscription } = session.user;

	if (
		!subscription ||
		!subscription.active ||
		(["stripe", "chargebee"].includes(subscription.platform) &&
			(platform === "web" || !native)) ||
		(subscription.platform === "ios" && platform === "apple" && native) ||
		(subscription.platform === "android" && platform === "android" && native)
	)
		return children;

	return null;
};
