import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { urls } from "~/urls";

import { ButtonLink } from "../button";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { DrawerOrDialog } from "../drawer-or-dialog";
import { DiscordIcon } from "../icons";

export interface IdeasDialogProps {
	onClose: () => void;
}

export const IdeasDialog: FC<IdeasDialogProps> = ({ onClose }) => {
	const { t } = useTranslation();

	return (
		<DrawerOrDialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>{t("ideas_dialog_title")}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<div className="flex flex-col gap-4 desktop:max-w-sm">
						<Trans
							components={{
								p: <p />,
								strong: <strong />
							}}
							i18nKey="ideas_dialog_description"
						/>
						<ButtonLink
							href={urls.socials.discord}
							Icon={DiscordIcon}
						>
							{t("join_discord")}
						</ButtonLink>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
