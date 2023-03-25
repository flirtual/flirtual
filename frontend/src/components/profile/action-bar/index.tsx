import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	ClipboardDocumentIcon,
	NoSymbolIcon,
	ShieldCheckIcon
} from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";
import { Tooltip } from "~/components/tooltip";

import { BanProfile } from "./ban-profile";
import { ReportProfile } from "./report-profile";

export const ProfileActionBar: React.FC<{ user: User }> = ({ user }) => {
	const [session, mutateSession] = useSession();
	if (!session) return null;

	return (
		<div className="flex w-full justify-between gap-3 p-8 dark:bg-black-70">
			<div className="flex gap-4">
				{session.user.tags.includes("debugger") && (
					<>
						<Tooltip value="Copy user id">
							<button type="button" onClick={() => navigator.clipboard.writeText(user.id)}>
								<ClipboardDocumentIcon className="h-6 w-6" />
							</button>
						</Tooltip>
						<Tooltip value="Copy username">
							<button type="button" onClick={() => navigator.clipboard.writeText(user.username)}>
								<ClipboardDocumentIcon className="h-6 w-6" />
							</button>
						</Tooltip>
					</>
				)}
				{session.user.tags.includes("admin") && (
					<>
						<Tooltip value="Sudo">
							<button
								type="button"
								onClick={async () => {
									const session = await api.auth.sudo({ body: { userId: user.id } });
									await mutateSession(session);
								}}
							>
								<ArrowRightOnRectangleIcon className="h-6 w-6" />
							</button>
						</Tooltip>
					</>
				)}
				{session.sudoerId && (
					<Tooltip value="Revoke Sudo">
						<button
							type="button"
							onClick={async () => {
								const session = await api.auth.revokeSudo();
								await mutateSession(session);
							}}
						>
							<ArrowLeftOnRectangleIcon className="h-6 w-6" />
						</button>
					</Tooltip>
				)}
				{session.user.tags.includes("moderator") && (
					<>
						<BanProfile user={user} />
						<Tooltip fragmentClassName="h-6 w-6" value="Clear reports">
							<button
								type="button"
								onClick={async () => {
									await api.report.clearAll({ query: { targetId: user.id } });
								}}
							>
								<ShieldCheckIcon className="h-6 w-6" />
							</button>
						</Tooltip>
					</>
				)}
			</div>
			<div className="flex gap-4">
				{session.user.id !== user.id && (
					<>
						<Tooltip value="Block profile">
							<button className="h-6 w-6" type="button">
								<NoSymbolIcon className="h-full w-full" />
							</button>
						</Tooltip>
						<ReportProfile user={user} />
					</>
				)}
			</div>
		</div>
	);
};
