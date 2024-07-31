"use client";

import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";

import { useToast } from "~/hooks/use-toast";
import { api } from "~/api";

import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { DialogTrigger } from "../dialog/dialog";

import { ReportDialog } from "./dialogs/report";

import type { User } from "~/api/user";

export const BlockedActions: React.FC<{ user: User }> = ({ user }) => {
	const toasts = useToast();
	const router = useRouter();

	return (
		<div className="flex gap-4">
			<Button
				className="w-fit"
				size="sm"
				onClick={async () => {
					await api.user
						.unblock(user.id)
						.then(() => {
							toasts.add("User unblocked");
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				Unblock
			</Button>
			<Tooltip>
				<ReportDialog user={user}>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<button className="w-fit gap-2" type="button">
								<Flag className="size-5" />
							</button>
						</DialogTrigger>
					</TooltipTrigger>
				</ReportDialog>
				<TooltipContent>Report profile</TooltipContent>
			</Tooltip>
		</div>
	);
};
