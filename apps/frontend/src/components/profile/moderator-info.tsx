import { FC } from "react";
import useSWR from "swr";

import { User } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";

import { DateTimeRelative } from "../datetime-relative";

export const ProfileModeratorInfo: FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();

	const {
		data: { visible, reasons }
	} = useSWR(["user", user.id, "visible"], () => api.user.visible(user.id), {
		suspense: true
	});

	if (!session || !session.user?.tags?.includes("moderator")) return null;

	return (
		<div className="flex flex-col">
			<span>
				<span className="font-bold">Registered:</span>{" "}
				{user.createdAt && <DateTimeRelative value={user.createdAt} />}
			</span>
			<span>
				<span className="font-bold">Last login:</span>{" "}
				{user.activeAt && <DateTimeRelative value={user.activeAt} />}
			</span>
			<span>
				<span className="font-bold">Banned:</span>{" "}
				{user.bannedAt ? (
					<DateTimeRelative
						elementProps={{ className: "text-red-500" }}
						value={user.bannedAt}
					/>
				) : (
					"No"
				)}
			</span>
			<span>
				<span className="font-bold">Shadowbanned:</span>{" "}
				{user.shadowbannedAt ? (
					<DateTimeRelative
						elementProps={{ className: "text-red-500" }}
						value={user.shadowbannedAt}
					/>
				) : (
					"No"
				)}
			</span>
			<span>
				<span className="font-bold">Deactivated:</span>{" "}
				{user.deactivatedAt ? (
					<DateTimeRelative
						elementProps={{ className: "text-red-500" }}
						value={user.deactivatedAt}
					/>
				) : (
					"No"
				)}
			</span>
			<span>
				<span className="font-bold">Visible:</span>{" "}
				{visible ? (
					"Yes"
				) : (
					<span className="text-red-500">
						No
						{reasons.length > 0
							? `, ${reasons.map(({ reason }) => reason).join(", ")}.`
							: ""}
					</span>
				)}
			</span>
			<span>
				<span className="font-bold">Premium:</span>{" "}
				{user.subscription?.active ? (
					<span className="text-green-500">{user.subscription.plan.name}</span>
				) : (
					"No"
				)}
			</span>
		</div>
	);
};
