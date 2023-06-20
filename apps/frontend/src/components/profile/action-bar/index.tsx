"use client";

import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	NoSymbolIcon,
	ScaleIcon,
	ShieldCheckIcon,
	TrashIcon
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { FC, Suspense, useState } from "react";
import { Dialog } from "@capacitor/dialog";

import { User, displayName } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";
import { Tooltip } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";

import { ProfileModeratorInfo } from "../moderator-info";

import { ReportProfile } from "./report-profile";
import { BanProfile } from "./ban-profile";
import { WarnProfile } from "./warn-profile";

const ActionDivider: FC = () => (
	<div className="h-6 w-0.5 border-l-2 border-black-60" />
);

export const ProfileActionBar: FC<{ user: User }> = ({ user }) => {
	const [session, mutateSession] = useSession();
	const router = useRouter();
	const toasts = useToast();

	const [warnProfileVisible, setWarnProfileVisible] = useState(false);

	if (!session) return null;

	return (
		<div className="flex flex-col gap-8 p-8 dark:bg-black-70">
			{session.user.tags?.includes("moderator") && (
				<Suspense>
					<ProfileModeratorInfo
						setWarnProfileVisible={setWarnProfileVisible}
						user={user}
					/>
				</Suspense>
			)}
			<div className="flex w-full justify-between gap-3">
				<div className="flex gap-4">
					{session.user.id !== user.id &&
						session.user.tags?.includes("moderator") && (
							<>
								<BanProfile user={user} />
								<WarnProfile
									user={user}
									visible={warnProfileVisible}
									onVisibilityChange={setWarnProfileVisible}
								/>
								<ActionDivider />
								<Tooltip fragmentClassName="h-6 w-6" value="Clear reports">
									<button
										type="button"
										onClick={async () => {
											await api.report
												.clearAll({ query: { targetId: user.id } })
												.then(({ count }) =>
													toasts.add(
														`Cleared ${count} report${count === 1 ? "" : "s"}`
													)
												)
												.catch(toasts.addError);
										}}
									>
										<ShieldCheckIcon className="h-6 w-6" />
									</button>
								</Tooltip>
								{session.user.tags?.includes("admin") && user.bannedAt && (
									<Tooltip value="Pardon profile">
										<button
											type="button"
											onClick={async () => {
												await api.user.unsuspend(user.id);

												toasts.add(`Pardoned ${displayName(user)}`);
												router.refresh();
											}}
										>
											<ScaleIcon className="h-6 w-6" />
										</button>
									</Tooltip>
								)}
							</>
						)}
					{session.user.tags?.includes("admin") && (
						<>
							{session.user.id !== user.id &&
								session.user.tags.includes("moderator") && <ActionDivider />}
							{user.id !== session.user.id && (
								<>
									<Tooltip value="Delete account">
										<button
											className="text-red-500"
											type="button"
											onClick={async () => {
												const { value } = await Dialog.confirm({
													title: "Confirm",
													message:
														"Are you sure you want to delete this account?"
												});

												if (!value) return;
												await api.user
													.adminDelete(user.id)
													.then(() => toasts.add("User deleted successfully"))
													.catch(toasts.addError);
											}}
										>
											<TrashIcon className="h-6 w-6" />
										</button>
									</Tooltip>
									<Tooltip value="Impersonate">
										<button
											className="disabled:cursor-not-allowed disabled:opacity-50"
											disabled={!!user.bannedAt}
											type="button"
											onClick={async () => {
												const session = await api.auth.sudo({
													body: { userId: user.id }
												});

												toasts.add(`Impersonating ${displayName(user)}`);
												await mutateSession(session);
											}}
										>
											<ArrowRightOnRectangleIcon className="h-6 w-6" />
										</button>
									</Tooltip>
								</>
							)}
						</>
					)}
					{session.sudoerId && (
						<>
							{session.user.id !== user.id &&
								session.user?.tags?.includes("moderator") && <ActionDivider />}
							<Tooltip value="Cancel Impersonation">
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
						</>
					)}
				</div>
				<div className="flex gap-4">
					{session.user.id !== user.id && (
						<>
							<Tooltip value="Block profile">
								<button
									className="h-6 w-6"
									type="button"
									onClick={async () => {
										await api.user
											.block(user.id)
											.then(() => {
												toasts.add("User blocked successfully");
												return router.refresh();
											})
											.catch(toasts.addError);
									}}
								>
									<NoSymbolIcon className="h-full w-full" />
								</button>
							</Tooltip>
							<ReportProfile user={user} />
						</>
					)}
				</div>
			</div>
		</div>
	);
};
