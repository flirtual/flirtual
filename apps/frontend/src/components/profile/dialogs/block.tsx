import { useTranslations } from "next-intl";
import type { FC, PropsWithChildren } from "react";

import { ProspectKind } from "~/api/matchmaking";
import { displayName, User } from "~/api/user";
import { optimisticQueueMove } from "~/app/[locale]/(app)/(authenticated)/(onboarded)/browse/queue-actions";
import { Button } from "~/components/button";
import { DialogFooter } from "~/components/dialog/dialog";
import { useToast } from "~/hooks/use-toast";
import { useSearchParams } from "~/i18n/navigation";
import { invalidate, mutate, queueKey, userKey } from "~/query";

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

								const kind = (query.get("kind") || "love") as ProspectKind;
								if (ProspectKind.includes(kind))
									mutate(queueKey(kind), optimisticQueueMove("forward"));
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
