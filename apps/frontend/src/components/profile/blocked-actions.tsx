import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";

import { displayName, User } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { invalidate, relationshipKey } from "~/query";

import { Button } from "../button";
import { DialogTrigger } from "../dialog/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { ReportDialog } from "./dialogs/report";

export const BlockedActions: React.FC<{ user: User }> = ({ user }) => {
	const { t } = useTranslation();
	const toasts = useToast();

	return (
		<div className="flex gap-4">
			<Button
				className="w-fit"
				size="sm"
				onClick={async () => {
					await User.unblock(user.id)
						.then(() => toasts.add(t("unblocked_name", { name: displayName(user) })))
						.catch(toasts.addError);

					await invalidate({ queryKey: relationshipKey(user.id) });
				}}
			>
				{t("unblock")}
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
				<TooltipContent>{t("report_profile")}</TooltipContent>
			</Tooltip>
		</div>
	);
};
