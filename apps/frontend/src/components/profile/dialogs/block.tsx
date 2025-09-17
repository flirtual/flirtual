import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
import { Button } from "~/components/button";
import { DialogFooter } from "~/components/dialog/dialog";
import { invalidateMatch, useQueue } from "~/hooks/use-queue";
import { useToast } from "~/hooks/use-toast";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle
} from "../../dialog/alert";

export const BlockDialog: FC<PropsWithChildren<{ user: User }>> = ({
	user,
	children
}) => {
	const { t } = useTranslation();
	const toasts = useToast();

	const { removeAll: removeFromQueue } = useQueue();

	return (
		<AlertDialog>
			{children}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("block_name", {
							name: user.profile.displayName || user.slug
						})}
					</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>{t("barbarous_hypnotic_thank_book")}</AlertDialogDescription>
				<DialogFooter>
					<AlertDialogCancel asChild>
						<Button kind="tertiary" size="sm">
							{t("cancel")}
						</Button>
					</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button
							size="sm"
							onClick={async () => {
								await User.block(user.id)
									.then(() => toasts.add(t("blocked_name", { name: user.profile.displayName || t("unnamed_user") })))
									.catch(toasts.addError);

								await Promise.all([
									invalidateMatch(user.id),
									removeFromQueue(user.id)
								]);
							}}
						>
							{t("block")}
						</Button>
					</AlertDialogAction>
				</DialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
