import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { ProspectKind } from "~/api/matchmaking";
import { Button, ButtonLink } from "~/components/button";
import { DialogBody, DialogDescription, DialogHeader, DialogTitle } from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { InlineLink } from "~/components/inline-link";
import { UserAvatar } from "~/components/user-avatar";
import { useSession } from "~/hooks/use-session";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

export interface ItsAMatchProps {
	userId: string;
	conversationId: string;
	kind: ProspectKind;
	onClose: () => void;
}

export const ItsAMatch: FC<ItsAMatchProps> = ({ userId, conversationId, kind, onClose }) => {
	const { t } = useTranslation();
	const { user: me } = useSession();
	const user = useUser(userId);
	if (!user) return null;

	const Icon = kind === "love" ? HeartIcon : PeaceIcon;

	return (
		<DrawerOrDialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>{t("its_a_match")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody>
					<div className="flex flex-col justify-between gap-4">
						<span>
							<Trans
								components={{
									name: (
										<InlineLink
											data-block
											href={urls.profile(user)}
										>
											{user.profile.displayName || t("unnamed_user")}
										</InlineLink>
									)
								}}
								i18nKey="green_aqua_ibex_value"
							/>
						</span>
						<div className="flex items-center justify-center gap-4">
							<UserAvatar
								className="size-32 rounded-3xl"
								height={256}
								user={me}
								width={256}
							/>
							<Icon className="size-12 shrink-0" />
							<UserAvatar
								className="size-32 rounded-3xl"
								height={256}
								user={user}
								width={256}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<ButtonLink href={urls.conversations.of(conversationId)} onClick={onClose}>
								{t("send_a_message")}
							</ButtonLink>
							<Button kind="tertiary" size="sm" onClick={onClose}>
								{t("continue_browsing")}
							</Button>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>

	);
};
