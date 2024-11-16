"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { mutate } from "swr";

import { displayName, User } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { relationshipKey } from "~/swr";

import { Button } from "../button";
import { DialogTrigger } from "../dialog/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { ReportDialog } from "./dialogs/report";

export const BlockedActions: React.FC<{ user: User }> = ({ user }) => {
	const t = useTranslations("profile");
	const toasts = useToast();

	return (
		<div className="flex gap-4">
			<Button
				className="w-fit"
				size="sm"
				onClick={async () => {
					await User.unblock(user.id).catch(toasts.addError);
					mutate(relationshipKey(user.id));

					toasts.add(
						t("top_sweet_macaw_pet", { displayName: displayName(user) })
					);
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
