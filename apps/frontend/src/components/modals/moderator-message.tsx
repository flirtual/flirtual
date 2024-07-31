"use client";

import { useRouter } from "next/navigation";

import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { acknowledgeWarn } from "~/api/user";
import { useToast } from "~/hooks/use-toast";

import { DrawerOrDialog } from "../drawer-or-dialog";
import { Button } from "../button";
import { InlineLink } from "../inline-link";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";

import type { FC } from "react";

export const ModeratorMessageDialog: FC = () => {
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();

	if (!session || !session.user.moderatorMessage) return null;

	return (
		<DrawerOrDialog open closable={false}>
			<>
				<DialogHeader>
					<DialogTitle>Flirtual Moderation</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<div className="flex min-h-96 flex-col justify-between gap-4 px-2 desktop:max-w-sm">
						<div className="flex flex-col gap-4">
							<h1 className="text-lg">
								You&apos;ve received a message from the Flirtual moderation
								team:
							</h1>
							<p data-sentry-mask className="font-nunito italic">
								{session.user.moderatorMessage}
							</p>
						</div>
						<div className="flex flex-col gap-2">
							<Button
								size="sm"
								onClick={() =>
									acknowledgeWarn(session.user.id)
										.then(() => {
											toasts.add("Message acknowledged");
											return router.refresh();
										})
										.catch(toasts.addError)
								}
							>
								Acknowledge
							</Button>
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
