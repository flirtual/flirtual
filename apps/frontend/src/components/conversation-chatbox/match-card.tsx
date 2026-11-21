import type { MessageProps } from "@talkjs/react-components";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { ProspectKind } from "~/api/matchmaking";
import type { User } from "~/api/user";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { TimeRelative } from "~/components/time-relative";
import { UserAvatar } from "~/components/user-avatar";

export interface Match {
	kind: ProspectKind;
	me: User;
	participant: User;
}

// The conversation's first message, drawn like the dialog shown when the match happened (ItsAMatch).
export const MatchCard: FC<{ match: Match; message: MessageProps["message"] }> = ({ match: { kind, me, participant }, message }) => {
	const { t } = useTranslation();
	const Icon = kind === "love" ? HeartIcon : PeaceIcon;

	return (
		<div data-match className="chat-message mt-2 flex w-full flex-col items-center gap-3 py-4 text-center!" data-sender="system">
			<div className="flex items-center justify-center gap-4">
				<UserAvatar className="size-20 rounded-3xl shadow-brand-1" height={160} user={me} width={160} />
				<Icon className="size-10 shrink-0 fill-(--fill)!" />
				<UserAvatar className="size-20 rounded-3xl shadow-brand-1" height={160} user={participant} width={160} />
			</div>
			<span className="font-montserrat text-xl! font-semibold!">{t("its_a_match")}</span>
			<span className="opacity-75">
				<Trans
					components={{ name: <span data-mask>{participant.profile.displayName || t("unnamed_user")}</span> }}
					i18nKey="match_description"
				/>
			</span>
			<TimeRelative elementProps={{ className: "text-[0.74em]! opacity-75 select-none" }} value={new Date(message.createdAt).toISOString()} />
		</div>
	);
};
