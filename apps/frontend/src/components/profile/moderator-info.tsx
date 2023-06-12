"use client";

import { User } from "~/api/user";
import { formatDateTime } from "~/date";
import { useSession } from "~/hooks/use-session";

export const ProfileModeratorInfo: React.FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();

	if (!session || !session.user.tags?.includes("moderator")) return null;

	return (
		<div className="mx-8 flex flex-col">
			<span suppressHydrationWarning>
				<span className="font-bold">Registered:</span>{" "}
				{user.createdAt && formatDateTime(user.createdAt)}
			</span>
			<span suppressHydrationWarning>
				<span className="font-bold">Last login:</span>{" "}
				{user.activeAt && formatDateTime(user.activeAt)}
			</span>
			<span suppressHydrationWarning>
				<span className="font-bold">Banned:</span>{" "}
				{user.bannedAt ? (
					<span className="text-red-500">{formatDateTime(user.bannedAt)}</span>
				) : (
					"No"
				)}
			</span>
			<span suppressHydrationWarning>
				<span className="font-bold">Shadowbanned:</span>{" "}
				{user.shadowbannedAt ? (
					<span className="text-red-500">
						{formatDateTime(user.shadowbannedAt)}
					</span>
				) : (
					"No"
				)}
			</span>
			<span suppressHydrationWarning>
				<span className="font-bold">Deactivated:</span>{" "}
				{user.deactivatedAt ? (
					<span className="text-red-500">
						{formatDateTime(user.deactivatedAt)}
					</span>
				) : (
					"No"
				)}
			</span>
			<span>
				<span className="font-bold">Visible:</span>{" "}
				{user.visible ? "Yes" : <span className="text-red-500">No</span>}
			</span>
			<span>
				<span className="font-bold">Premium:</span>{" "}
				{user.subscription?.active ? (
					<span className="text-red-500">{user.subscription.plan.name}</span>
				) : (
					"No"
				)}
			</span>
		</div>
	);
};
