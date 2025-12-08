import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { invalidate, relationshipKey } from "~/query";

import { Button } from "../button";
import { DialogTrigger } from "../dialog/dialog";
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
						.then(() => toasts.add(t("unblocked_name", { name: user.profile.displayName || t("unnamed_user") })))
						.catch(toasts.addError);

					await invalidate({ queryKey: relationshipKey(user.id) });
				}}
			>
				{t("unblock")}
			</Button>
			<ReportDialog user={user}>
				<DialogTrigger asChild>
					<Button className="gap-2 px-4" kind="tertiary" size="sm">
						<Flag className="size-6" />
						{t("report")}
					</Button>
				</DialogTrigger>
			</ReportDialog>
		</div>
	);
};
