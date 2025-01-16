"use client";

import ms from "ms";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Dispatch, FC, ReactNode } from "react";

import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import { Button } from "../button";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { DrawerOrDialog } from "../drawer-or-dialog";
import { InlineLink } from "../inline-link";

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
					.catch(toasts.addError)}
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
			actions={(
				<div className="grid grid-cols-2 gap-2">
					<Button
						size="sm"
						onClick={async () => {
							await remindMeLater(true);

							router.push(urls.settings.bio);
							router.refresh();
						}}
					>
						Edit profile
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
			)}
			onOpenChange={async (open) => {
				if (open) return;

				await remindMeLater();
				router.refresh();
			}}
		>
			It looks like you&apos;ve mentioned your Discord username on your profile. For your privacy, we strongly recommend removing your Discord from your bio or display name and
			{" "}
			<InlineLink href={urls.settings.connections}>
				connecting your Discord account
			</InlineLink>
			{" "}
			instead.
			<br />
			<br />
			This helps protect you from spam and unwanted messages by only sharing your Discord with your matches.
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
							alt={t("flirtual")}
							className="hidden h-fit w-24 dark:block desktop:block"
							height={1000}
							src={urls.media("flirtual-white.svg", "files")}
							width={3468}
						/>
						<Image
							alt={t("flirtual")}
							className="block h-fit w-24 dark:hidden desktop:hidden"
							height={1000}
							src={urls.media("flirtual-black.svg", "files")}
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
