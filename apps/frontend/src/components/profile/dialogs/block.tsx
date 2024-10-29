import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC, PropsWithChildren } from "react";
import { mutate } from "swr";

import { displayName, User } from "~/api/user";
import { Button } from "~/components/button";
import { DialogFooter } from "~/components/dialog/dialog";
import { useToast } from "~/hooks/use-toast";
import { userKey } from "~/swr";

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
								await User.block(user.id).catch(toasts.addError);
								mutate(userKey(user.id));

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
