import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { useDevice } from "~/hooks/use-device";
import { urls } from "~/urls";

import { Button, ButtonLink } from "./button";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "./dialog/dialog";
import { DrawerOrDialog } from "./drawer-or-dialog";

export const UpdateRequiredDialog: FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
	const { t } = useTranslation();
	const { apple, platform } = useDevice();

	return (
		<DrawerOrDialog
			open
			className="desktop:max-w-lg"
			closable={!!onDismiss}
			onOpenChange={(open) => {
				if (!open) onDismiss?.();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>{t("update_required")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody className="group-data-[drawer]:min-h-48">
					<p>{t("update_required_description", { platform })}</p>
					<div className="flex gap-2">
						<ButtonLink
							className="grow"
							href={apple ? urls.apps.apple : urls.apps.google}
							size="sm"
						>
							{t("update")}
						</ButtonLink>
						{onDismiss && (
							<Button
								className="grow"
								kind="tertiary"
								size="sm"
								onClick={onDismiss}
							>
								{t("not_now")}
							</Button>
						)}
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
