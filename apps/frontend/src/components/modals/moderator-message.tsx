"use client";

import { useRouter } from "next/navigation";
import ms from "ms";

import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { acknowledgeWarn, update } from "~/api/user";
import { useToast } from "~/hooks/use-toast";

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
				acknowledgeWarn(session.user.id)
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

		await update(session.user.id, {
			body: {
				tnsDiscordInBiography: new Date(Date.now() + ms("30d")).toISOString()
			}
		});

		if (!quiet) toasts.add("You will be reminded in 30 days.");
	};

	return (
		<TrustAndSafetyDialog
			closable
			onOpenChange={async (open) => {
				if (open) return;

				await remindMeLater();
				router.refresh();
			}}
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
						size="sm"
						kind="tertiary"
						onClick={async () => {
							await remindMeLater();
							router.refresh();
						}}
						className="text-sm"
					>
						Remind me later
					</Button>
				</div>
			}
		>
			To help prevent spam, we've hidden your account from recently created
			Flirtual accounts because it looks like you've included your Discord
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

	if (!session) return null;

	return (
		<DrawerOrDialog open closable={closable} onOpenChange={onOpenChange}>
			<>
				<DialogHeader>
					<DialogTitle className="flex h-full items-center gap-2">
						<FlirtualLogo className="h-full" />
						<span>Trust & Safety</span>
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<div className="flex min-h-64 flex-col justify-between gap-4 px-2 desktop:max-w-lg">
						<div className="flex flex-col gap-4">
							{/* <h1 className="text-lg">
								You&apos;ve received a message from the Flirtual moderation
								team:
							</h1> */}
							<p data-sentry-mask className="whitespace-pre-wrap font-nunito">
								{children}
							</p>
						</div>
						<div className="flex flex-col gap-2">
							{actions || (
								<Button size="sm" onClick={onAcknowledge}>
									Acknowledge
								</Button>
							)}
							<span className="flex max-w-sm flex-row justify-center gap-4 font-nunito text-xs">
								<InlineLink href={urls.resources.communityGuidelines}>
									Community guidelines
								</InlineLink>
								<InlineLink href={urls.resources.contactDirect}>
									Contact us
								</InlineLink>
							</span>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
