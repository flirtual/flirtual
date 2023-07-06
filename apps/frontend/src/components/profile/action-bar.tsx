"use client";

import { FlagIcon, NoSymbolIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { FC, Suspense } from "react";

import { User } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { DialogTrigger } from "~/components/dialog/dialog";

import { ProfileModeratorInfo } from "./moderator-info";
import { ProfileDropdown } from "./dropdown";
import { ReportDialog } from "./dialogs/report";

export const ProfileActionBar: FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	if (
		!session ||
		(session.user.id === user.id &&
			!session.user.tags?.includes("moderator") &&
			!session.user.tags?.includes("admin"))
	)
		return null;

	return (
		<div className="flex flex-col gap-8 px-8 pb-0 pt-4 dark:bg-black-70 md:pb-4">
			{session.user.tags?.includes("moderator") && (
				<Suspense>
					<ProfileModeratorInfo user={user} />
				</Suspense>
			)}
			<div className="flex w-full gap-4">
				{(session.user.tags?.includes("moderator") ||
					session.user.tags?.includes("admin")) && (
					<ProfileDropdown user={user} />
				)}
				<div className="ml-auto flex gap-4">
					{session.user.id !== user.id && (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="h-6 w-6 shrink-0"
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
								</TooltipTrigger>
								<TooltipContent>Block profile</TooltipContent>
							</Tooltip>
							<Tooltip>
								<ReportDialog user={user}>
									<TooltipTrigger asChild>
										<DialogTrigger asChild>
											<button className="w-full gap-2" type="button">
												<FlagIcon className="h-6 w-6" />
											</button>
										</DialogTrigger>
									</TooltipTrigger>
								</ReportDialog>
								<TooltipContent>Report profile</TooltipContent>
							</Tooltip>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
