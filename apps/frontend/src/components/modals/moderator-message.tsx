"use client";

import { useRouter } from "next/navigation";
import ms from "ms";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { useToast } from "~/hooks/use-toast";
import { User } from "~/api/user";

import { DrawerOrDialog } from "../drawer-or-dialog";
import { Button } from "../button";
import { InlineLink } from "../inline-link";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { FlirtualLogo } from "../logo";

import type { Dispatch, FC, ReactNode } from "react";

export const ModerationMessageDialog: FC = () => {
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();

	if (!session?.user.moderatorMessage) return null;

	return (
		<TrustAndSafetyDialog
			onAcknowledge={() =>
				User.acknowledgeWarn(session.user.id)
					.then(() => {
						toasts.add("Message acknowledged");
						return router.refresh();
					})
					.catch(toasts.addError)
			}
		>
			{session.user.moderatorMessage}
		</TrustAndSafetyDialog>
	);
};

export const DiscordSpamDialog: FC = () => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	const remindMeLater = async (quiet: boolean = false) => {
		if (!session) return;

		await User.update(session.user.id, {
			tnsDiscordInBiography: new Date(Date.now() + ms("30d")).toISOString()
		});

		if (!quiet) toasts.add("You will be reminded in 30 days.");
	};

	return (
		<TrustAndSafetyDialog
			closable
			actions={
				<div className="grid grid-cols-2 gap-2">
					<Button
						size="sm"
						onClick={async () => {
							await remindMeLater(true);

							router.push(urls.settings.bio);
							router.refresh();
						}}
					>
						Edit biography
					</Button>
					<Button
						className="text-sm"
						kind="tertiary"
						size="sm"
						onClick={async () => {
							await remindMeLater();
							router.refresh();
						}}
					>
						Remind me later
					</Button>
				</div>
			}
			onOpenChange={async (open) => {
				if (open) return;

				await remindMeLater();
				router.refresh();
			}}
		>
			To help prevent spam, we&apos;ve hidden your account from recently created
			Flirtual accounts because it looks like you&apos;ve included your Discord
			username in your biography.
			<br />
			<br />
			We recommend removing{" "}
			<span className="font-semibold">any references</span> to Discord from your
			biography and instead{" "}
			<InlineLink href={urls.settings.connections}>
				connect your Discord account
			</InlineLink>{" "}
			directly through your settings.
			<br />
			<br />
			This way, your Discord will only be visible to people you match with or as
			per your customized{" "}
			<InlineLink href={urls.settings.privacy}>privacy settings</InlineLink>.
		</TrustAndSafetyDialog>
	);
};

export const TrustAndSafetyDialog: FC<{
	children: ReactNode;
	onAcknowledge?: () => void;
	onOpenChange?: Dispatch<boolean>;
	actions?: ReactNode;
	closable?: boolean;
}> = ({ children, actions, closable = false, onAcknowledge, onOpenChange }) => {
	const [session] = useSession();
	const t = useTranslations();

	if (!session) return null;

	return (
		<DrawerOrDialog open closable={closable} onOpenChange={onOpenChange}>
			<>
				<DialogHeader>
					<DialogTitle className="flex h-full items-center gap-2">
						<Image
							alt={t("meta.name")}
							className="hidden h-fit w-24 dark:block desktop:block"
							height={1000}
							src={urls.media("flirtual-white.svg", "files")}
							width={3468}
						/>
						<Image
							alt={t("meta.name")}
							className="block h-fit w-24 dark:hidden desktop:hidden"
							height={1000}
							src={urls.media("flirtual-black.svg", "files")}
							width={3468}
						/>
						<span>{t("dialogs.trust_and_safety.title")}</span>
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<div className="flex min-h-64 flex-col justify-between gap-4 px-2 desktop:max-w-lg">
						<div className="flex flex-col gap-4">
							<p data-sentry-mask className="whitespace-pre-wrap font-nunito">
								{children}
							</p>
						</div>
						<div className="flex flex-col gap-2">
							{actions || (
								<Button size="sm" onClick={onAcknowledge}>
									{t("dialogs.trust_and_safety.acknowledge")}
								</Button>
							)}
							<span className="flex flex-row justify-center gap-4 font-nunito text-xs">
								<InlineLink href={urls.resources.communityGuidelines}>
									{t("dialogs.trust_and_safety.lofty_day_snail_treasure")}
								</InlineLink>
								<InlineLink href={urls.resources.contactDirect}>
									{t("dialogs.trust_and_safety.jolly_nimble_crow_taste")}
								</InlineLink>
							</span>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
