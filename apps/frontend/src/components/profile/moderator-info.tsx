import { User } from "~/api/user";
import { thruServerCookies, withSession } from "~/server-utilities";
import { api } from "~/api";

import { DateTimeRelative } from "../datetime-relative";

export async function ProfileModeratorInfo({ user }: { user: User }) {
	const session = await withSession();
	if (!session.user.tags?.includes("moderator")) return null;

	const { visible, reasons } = await api.user.visible(
		user.id,
		thruServerCookies()
	);

	return (
		<div className="mx-8 flex flex-col">
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
}
