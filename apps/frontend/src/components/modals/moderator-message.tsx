"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { acknowledgeWarn } from "~/api/user";
import { useToast } from "~/hooks/use-toast";

import { DrawerOrModal } from "../drawer-or-modal";
import { Button } from "../button";
import { InlineLink } from "../inline-link";

export const ModeratorMessageModal: FC = () => {
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();

	if (!session || !session.user.moderatorMessage) return null;

	return (
		<DrawerOrModal visible={true}>
			<div className="flex min-h-[24rem] flex-col justify-between gap-4 px-2 sm:max-w-sm">
				<div className="flex flex-col gap-4">
					<h1 className="max-w-sm font-montserrat text-xl font-bold tracking-tight">
						You&apos;ve received a warning for violating the{" "}
						<InlineLink href={urls.resources.communityGuidelines}>
							Community Guidelines
						</InlineLink>
						.
					</h1>
					<div className="flex flex-col gap-4">
						<div className="h-1 w-1/2 rounded-full bg-brand-gradient" />
						<p className="max-w-md">{session.user.moderatorMessage}</p>
						<div className="h-1 w-2/12 rounded-full bg-brand-gradient" />
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<Button
						size="sm"
						onClick={() =>
							acknowledgeWarn(session.user.id)
								.then(() => {
									toasts.add("Warning acknowledged");
									return router.refresh();
								})
								.catch(toasts.addError)
						}
					>
						Acknowledge
					</Button>
					<span className="max-w-sm text-xs brightness-75">
						If you feel this warning was issued in error, please contact us at{" "}
						<InlineLink href={urls.resources.contactDirect}>
							our support desk
						</InlineLink>{" "}
						or open a ticket in the{" "}
						<InlineLink href={urls.socials.discord}>
							#server-reports channel
						</InlineLink>
						.
					</span>
				</div>
			</div>
		</DrawerOrModal>
	);
};
