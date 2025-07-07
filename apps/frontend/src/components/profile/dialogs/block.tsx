import { useTranslations } from "next-intl";
import type { FC, PropsWithChildren } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { displayName, User } from "~/api/user";
import { Button } from "~/components/button";
import { DialogFooter } from "~/components/dialog/dialog";
import { useQueue } from "~/hooks/use-queue";
import { useToast } from "~/hooks/use-toast";
import { useSearchParams } from "~/i18n/navigation";
import { invalidate, userKey } from "~/query";

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
	const t = useTranslations();
	const toasts = useToast();

	const query = useSearchParams();
	const kind = (query.get("kind") || "love") as ProspectKind;

	const { forward: forwardQueue } = useQueue(kind);

	return (
		<AlertDialog>
			{children}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("block_name", {
							name: displayName(user)
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
									.then(() => toasts.add(t("blocked_name", { name: displayName(user) })))
									.catch(toasts.addError);

								await invalidate({ queryKey: userKey(user.id) });
								await forwardQueue();
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
