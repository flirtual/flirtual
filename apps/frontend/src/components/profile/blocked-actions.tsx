"use client";

import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";

import { useToast } from "~/hooks/use-toast";
import { displayName, User } from "~/api/user";

import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { DialogTrigger } from "../dialog/dialog";

import { ReportDialog } from "./dialogs/report";

export const BlockedActions: React.FC<{ user: User }> = ({ user }) => {
	const t = useTranslations("profile");
	const toasts = useToast();
	const router = useRouter();

	return (
		<div className="flex gap-4">
			<Button
				className="w-fit"
				size="sm"
				onClick={async () => {
					await User.unblock(user.id)
						.then(() => {
							toasts.add(
								t("top_sweet_macaw_pet", { displayName: displayName(user) })
							);
							return router.refresh();
						})
						.catch(toasts.addError);
				}}
			>
				{t("polite_spicy_hamster_create")}
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
				<TooltipContent>{t("neat_lower_shell_tend")}</TooltipContent>
			</Tooltip>
		</div>
	);
};
