"use client";

import { useRouter } from "next/navigation";
import { Ban, Flag } from "lucide-react";

import { type User, displayName } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { DialogFooter, DialogTrigger } from "~/components/dialog/dialog";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "../dialog/alert";
import { Button } from "../button";

import { ProfileModeratorInfo } from "./moderator-info";
import { ProfileDropdown } from "./dropdown";
import { ReportDialog } from "./dialogs/report";

import type { FC } from "react";

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
		<div className="flex flex-col gap-8 px-8 py-4 pt-0 desktop:pb-8 desktop:dark:bg-black-70">
			{session.user.tags?.includes("moderator") && (
				<ProfileModeratorInfo user={user} />
			)}
			<div className="flex w-full gap-4">
				{(session.user.tags?.includes("moderator") ||
					session.user.tags?.includes("admin")) && (
					<ProfileDropdown user={user} />
				)}
				<div className="flex w-full justify-center gap-6 pb-4 vision:text-white-20 desktop:pb-0">
					{session.user.id !== user.id && (
						<>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className="gap-2 p-0" kind="tertiary" size="sm">
										<Ban className="size-full" />
										Block
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Block {displayName(user)}?
										</AlertDialogTitle>
									</AlertDialogHeader>
									<AlertDialogDescription>
										This will prevent you from seeing each other&apos;s profiles
										and messaging each other. This action is permanent and
										cannot be undone later.
									</AlertDialogDescription>
									<DialogFooter>
										<AlertDialogCancel asChild>
											<Button kind="tertiary" size="sm">
												Cancel
											</Button>
										</AlertDialogCancel>
										<AlertDialogAction asChild>
											<Button
												size="sm"
												onClick={async () => {
													await api.user
														.block(user.id)
														.then(() => {
															toasts.add(`Blocked ${displayName(user)}`);
															return router.refresh();
														})
														.catch(toasts.addError);
												}}
											>
												Block
											</Button>
										</AlertDialogAction>
									</DialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<ReportDialog user={user}>
								<DialogTrigger asChild>
									<Button className="gap-2 p-0" kind="tertiary" size="sm">
										<Flag className="size-6" />
										Report
									</Button>
								</DialogTrigger>
							</ReportDialog>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
