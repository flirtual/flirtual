import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { FC, PropsWithChildren } from "react";
import { mutate } from "swr";

import { ProspectKind } from "~/api/matchmaking";
import { displayName, User } from "~/api/user";
import { optimisticQueueMove } from "~/app/(app)/(session)/(onboarded)/browse/queue-actions";
import { Button } from "~/components/button";
import { DialogFooter } from "~/components/dialog/dialog";
import { useToast } from "~/hooks/use-toast";
import { queueKey, userKey } from "~/swr";

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
	const t = useTranslations("profile.dialogs.block");
	const toasts = useToast();
	const query = useSearchParams();

	return (
		<AlertDialog>
			{children}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("title", {
							displayName: displayName(user)
						})}
					</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>{t("description")}</AlertDialogDescription>
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
								await User.block(user.id).catch(toasts.addError);
								mutate(userKey(user.id));
								const kind = (query.get("kind") || "love") as ProspectKind;
								if (ProspectKind.includes(kind))
									mutate(queueKey(kind), optimisticQueueMove("forward"));

								toasts.add(
									t("swift_loved_albatross_leap", {
										displayName: displayName(user)
									})
								);
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
