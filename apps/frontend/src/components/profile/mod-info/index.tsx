"use client";

import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";

export const ProfileModInfo: React.FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();

	if (!session || !session.user.tags?.includes("moderator")) return null;

	return (
		<div className="mx-8 flex flex-col">
			<span>
				<span className="font-bold">Registered:</span>{" "}
				{user.createdAt && new Date(user.createdAt).toLocaleString()}
			</span>
			<span>
				<span className="font-bold">Last login:</span>{" "}
				{user.activeAt && new Date(user.activeAt).toLocaleString()}
			</span>
			<span>
				<span className="font-bold">Banned:</span>{" "}
				{user.bannedAt ? (
					<span className="text-red-500">{new Date(user.bannedAt).toLocaleString()}</span>
				) : (
					"No"
				)}
			</span>
			<span>
				<span className="font-bold">Shadowbanned:</span>{" "}
				{user.shadowbannedAt ? (
					<span className="text-red-500">{new Date(user.shadowbannedAt).toLocaleString()}</span>
				) : (
					"No"
				)}
			</span>
			<span>
				<span className="font-bold">Deactivated:</span>{" "}
				{user.deactivatedAt ? (
					<span className="text-red-500">{new Date(user.deactivatedAt).toLocaleString()}</span>
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
