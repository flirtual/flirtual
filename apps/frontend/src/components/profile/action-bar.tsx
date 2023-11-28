"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";
import { Ban, Flag } from "lucide-react";

import { User, displayName } from "~/api/user";
import { api } from "~/api";
import { useSession } from "~/hooks/use-session";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
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

export const ProfileActionBar: FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	// const [showExtraInformation, setShowExtraInformation] = useState(false);

	if (
		!session ||
		(session.user.id === user.id &&
			!session.user.tags?.includes("moderator") &&
			!session.user.tags?.includes("admin"))
	)
		return null;

	return (
		<div className="flex flex-col gap-8 px-8 py-4 sm:pb-8">
			{session.user.tags?.includes("moderator") && (
				<>
					{/* {showExtraInformation ? ( */}
					<ProfileModeratorInfo user={user} />
					{/* ) : (
						<button
							className="hover:underline"
							type="button"
							onClick={() => setShowExtraInformation(true)}
						>
							Show extra information
						</button>
					)} */}
				</>
			)}
			<div className="flex w-full gap-4">
				{(session.user.tags?.includes("moderator") ||
					session.user.tags?.includes("admin")) && (
					<ProfileDropdown user={user} />
				)}
				<div className="ml-auto flex gap-4">
					{session.user.id !== user.id && (
						<>
							<AlertDialog>
								<Tooltip>
									<TooltipTrigger asChild>
										<AlertDialogTrigger asChild>
											<button
												className="h-6 w-6 shrink-0"
												type="button"
												onClick={async () => {
													await api.user;
												}}
											>
												<Ban className="h-full w-full" />
											</button>
										</AlertDialogTrigger>
									</TooltipTrigger>
									<TooltipContent>Block profile</TooltipContent>
								</Tooltip>
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
															toasts.add("User blocked");
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
							<Tooltip>
								<ReportDialog user={user}>
									<TooltipTrigger asChild>
										<DialogTrigger asChild>
											<button className="w-full gap-2" type="button">
												<Flag className="h-6 w-6" />
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
