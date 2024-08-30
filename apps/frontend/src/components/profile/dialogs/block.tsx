import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "~/components/button";
import { DialogFooter } from "~/components/dialog/dialog";
import { api } from "~/api";
import { displayName, type User } from "~/api/user";
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

import type { FC, PropsWithChildren } from "react";

export const BlockDialog: FC<PropsWithChildren<{ user: User }>> = ({
	user,
	children
}) => {
	const t = useTranslations("profile.dialogs.block");
	const router = useRouter();
	const toasts = useToast();

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
								await api.user
									.block(user.id)
									.then(() => {
										toasts.add(
											t("swift_loved_albatross_leap", {
												displayName: displayName(user)
											})
										);
										return router.refresh();
									})
									.catch(toasts.addError);
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
