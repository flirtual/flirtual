import ms from "ms";
import type { Dispatch, FC, ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { Session } from "react-router";
import FlirtualBlack from "virtual:remote/static/flirtual-black.svg";
import FlirtualWhite from "virtual:remote/static/flirtual-white.svg";
import { withSuspense } from "with-suspense";

import { User } from "~/api/user";
import { Image } from "~/components/image";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { Button } from "../button";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { DrawerOrDialog } from "../drawer-or-dialog";
import { InlineLink } from "../inline-link";

export const ModerationMessageDialog: FC = withSuspense(() => {
	const session = useOptionalSession();
	const toasts = useToast();
	const { t } = useTranslation();

	if (!session?.user.moderatorMessage) return null;

	return (
		<TrustAndSafetyDialog
			onAcknowledge={() =>
				User.acknowledgeWarn(session.user.id)
					.then(async () => {
						const user = await toasts.add(t("message_acknowledged"));
						await mutate<Session>(sessionKey(), (session) => ({ ...session, user }));
					})
					.catch(toasts.addError)}
		>
			{session.user.moderatorMessage}
		</TrustAndSafetyDialog>
	);
});

export const DiscordSpamDialog: FC = withSuspense(() => {
	const session = useOptionalSession();

	const navigate = useNavigate();
	const toasts = useToast();

	const { t } = useTranslation();

	const remindMeLater = async (quiet: boolean = false) => {
		if (!session) return;

		const user = await User.update(session.user.id, {
			tnsDiscordInBiography: new Date(Date.now() + ms("30d")).toISOString()
		});

		if (!quiet) toasts.add(t("you_will_be_reminded_in_number_days", { number: 30 }));
		await mutate<Session>(sessionKey(), (session) => ({ ...session, user }));
	};

	if (!session?.user.tnsDiscordInBiography || new Date(session?.user.tnsDiscordInBiography).getTime() > Date.now())
		return null;

	return (
		<TrustAndSafetyDialog
			closable
			actions={(
				<div className="flex gap-2">
					<Button
						className="grow"
						size="sm"
						onClick={async () => {
							await remindMeLater(true);
							await navigate(urls.settings.bio);
						}}
					>
						{t("edit_profile")}
					</Button>
					<Button
						className="grow text-sm"
						kind="tertiary"
						size="sm"
						onClick={async () => {
							await remindMeLater();
						}}
					>
						{t("remind_me_later")}
					</Button>
				</div>
			)}
			onOpenChange={async (open) => {
				if (open) return;
				await remindMeLater();
			}}
		>
			<Trans
				components={{
					link: <InlineLink href={urls.settings.connections} />,
				}}
				i18nKey="tense_active_gibbon_dare"
			/>
		</TrustAndSafetyDialog>
	);
});

export const TrustAndSafetyDialog: FC<{
	children: ReactNode;
	onAcknowledge?: () => void;
	onOpenChange?: Dispatch<boolean>;
	actions?: ReactNode;
	closable?: boolean;
}> = ({ children, actions, closable = false, onAcknowledge, onOpenChange }) => {
	const session = useOptionalSession();
	const { t } = useTranslation();

	if (!session) return null;

	return (
		<DrawerOrDialog open closable={closable} onOpenChange={onOpenChange}>
			<>
				<DialogHeader>
					<DialogTitle className="flex h-full items-center gap-2">
						<Image
							alt={t("flirtual")}
							className="hidden h-fit w-24 dark:block desktop:block"
							height={1000}
							src={FlirtualWhite}
							width={3468}
						/>
						<Image
							alt={t("flirtual")}
							className="block h-fit w-24 dark:hidden desktop:hidden"
							height={1000}
							src={FlirtualBlack}
							width={3468}
						/>
						<span>{t("trust_and_safety")}</span>
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<div className="flex min-h-64 flex-col justify-between gap-4 px-2 desktop:max-w-lg">
						<div className="flex flex-col gap-4">
							<p data-mask className="whitespace-pre-wrap font-nunito">
								{children}
							</p>
						</div>
						<div className="flex flex-col gap-2">
							{actions || (
								<Button size="sm" onClick={onAcknowledge}>
									{t("i_acknowledge")}
								</Button>
							)}
							<span className="flex flex-row justify-center gap-4 font-nunito text-xs">
								<InlineLink href={urls.resources.communityGuidelines}>
									{t("community_guidelines")}
								</InlineLink>
								<InlineLink href={urls.resources.contactDirect}>
									{t("contact_us")}
								</InlineLink>
							</span>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
