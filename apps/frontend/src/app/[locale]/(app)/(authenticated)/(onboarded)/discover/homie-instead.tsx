import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { ResponseSource } from "~/api/matchmaking";
import { Button } from "~/components/button";
import { DialogBody, DialogDescription, DialogHeader, DialogTitle } from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { useQueue } from "~/hooks/use-queue";

export interface HomieInsteadProps {
	userId: string;
	source: ResponseSource;
	onPass: () => void;
	onClose: () => void;
}

export const HomieInstead: FC<HomieInsteadProps> = ({ userId, source, onPass, onClose }) => {
	const { t } = useTranslation();
	const { like: homie } = useQueue("friend", source);

	return (
		<DrawerOrDialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>{t("moving_petty_racoon_intend")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody>
					<div className="flex flex-col justify-between gap-4 desktop:max-w-sm">
						<span>{t("major_soft_puffin_offer")}</span>
						<div className="flex gap-2">
							<Button
								className="grow basis-0"
								kind="secondary"
								onClick={() => {
									onPass();
									onClose();
								}}
							>
								{t("pass")}
							</Button>
							<Button
								className="grow basis-0 bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 text-white-20 shadow-brand-1"
								kind={false}
								onClick={() => {
									void homie(userId);
									onClose();
								}}
							>
								{t("homie")}
							</Button>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
