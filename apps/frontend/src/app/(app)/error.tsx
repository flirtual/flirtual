"use client";

import * as Sentry from "@sentry/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSound from "use-sound";

import { displayName } from "~/api/user";
import { Button } from "~/components/button";
import { CopyClick } from "~/components/copy-click";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { Form, FormButton } from "~/components/forms";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputTextArea } from "~/components/inputs";
import { FlirtualLogo } from "~/components/logo";
import { environment, gitCommitSha } from "~/const";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

type ErrorWithDigest = { digest?: string } & Error;

export default function Error({
	error,
	reset
}: {
	error: ErrorWithDigest;
	reset: () => void;
}) {
	const router = useRouter();
	const [session] = useSession();
	const [addDetails, setAddDetails] = useState(false);
	const [squeak] = useSound(urls.media("squeak.mp3"));

	const eventId = useMemo(() => Sentry.captureException(error), [error]);
	error.digest ??= "000000000";

	return (
		<>
			<div className="flex min-h-screen w-full items-center justify-center opacity-75">
				<FlirtualLogo className="w-1/2 max-w-lg animate-pulse" />
			</div>
			<DrawerOrDialog
				open
				className="desktop:max-w-lg"
				onOpenChange={(open) => {
					if (open) return;
					reset();
				}}
			>
				<>
					<DialogHeader>
						<DialogTitle>It looks like we&apos;re having issues</DialogTitle>
						<DialogDescription className="sr-only" />
					</DialogHeader>
					<DialogBody className="flex flex-col">
						{addDetails ? (
							<>
								<p>Add some details to help us fix the issue faster.</p>
								<div className="select-children flex flex-col whitespace-pre-wrap font-mono text-xs">
									<span className="mb-2 font-bold">Error details</span>
									{error.digest && (
										<span>
											<span className="font-bold">Digest</span>
											:
											{error.digest}
										</span>
									)}
									{eventId && (
										<span>
											<span className="font-bold">Event</span>
											:
											{eventId}
										</span>
									)}
									<span className="mt-2">{error.message}</span>
								</div>
								<Form
									className="flex flex-col gap-4"
									fields={{ message: "" }}
									onSubmit={async ({ message }) => {
										if (session) Sentry.setUser({ id: session.user.id });

										Sentry.captureFeedback(
											{
												message,
												associatedEventId: eventId,
												...(session
													? {
															// We aren't respecting the user's privacy opt-out, because the user
															// is explicitly opting in to provide feedback.
															email: session?.user?.email,
															name: displayName(session?.user)
														}
													: {})
											},
											{
												includeReplay: true,
												originalException: error
											}
										);
									}}
								>
									{({ FormField }) => (
										<>
											<FormField name="message">
												{({ props, labelProps }) => (
													<>
														<InputLabel {...labelProps}>
															What happened?
														</InputLabel>
														<InputTextArea rows={5} {...props} />
													</>
												)}
											</FormField>
											<div className="flex gap-2">
												<FormButton
													className="w-fit"
													kind="secondary"
													size="sm"
												>
													Submit
												</FormButton>
												<Button
													className="w-fit px-2"
													kind="tertiary"
													size="sm"
													onClick={() => setAddDetails(false)}
												>
													View issue
												</Button>
											</div>
										</>
									)}
								</Form>
							</>
						) : (
							<>
								<CopyClick value={eventId}>{eventId}</CopyClick>
								<div className="relative flex flex-col gap-8 desktop:flex-row">
									<Image
										priority
										alt=""
										className="pettable h-16 w-fit shrink-0 rotate-[10deg]"
										height={345}
										src={urls.media("b25d8377-7035-4a23-84f1-faa095fa8104")}
										width={412}
										onClick={squeak}
									/>
									<motion.div
										animate={{ scale: 1, opacity: 1 }}
										className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80"
										initial={{ scale: 0.8, opacity: 0.5 }}
									>
										<div
											className="absolute -top-5 left-9 size-5 rotate-90 bg-white-10 desktop:-left-5 desktop:top-7 desktop:rotate-0"
											style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
										/>
										<p>
											You found a bug! We&apos;re sorry for the inconvenience.
											Our team has been notified and will fix it as soon as
											possible.
										</p>
										<div className="select-children flex max-w-sm flex-col whitespace-pre-wrap font-mono text-xs">
											{error.digest && (
												<span>
													Digest:
													{" "}
													{error.digest}
												</span>
											)}
											{eventId && (
												<span>
													Event:
													{" "}
													{eventId}
												</span>
											)}
										</div>
									</motion.div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button className="w-fit" size="sm" onClick={reset}>
										Try again
									</Button>
									<Button
										className="w-fit"
										kind="secondary"
										size="sm"
										onClick={() => router.back()}
									>
										Go back
									</Button>
									<Button
										className="w-fit px-2"
										kind="tertiary"
										size="sm"
										onClick={() => setAddDetails((addDetails) => !addDetails)}
									>
										Add details
									</Button>
								</div>
							</>
						)}
						<div className="mt-auto flex flex-col">
							<div className="flex gap-2">
								<InlineLink
									highlight={false}
									href={urls.resources.networkStatus}
								>
									Network Status
								</InlineLink>
								{" • "}
								<InlineLink highlight={false} href={urls.socials.discord}>
									Discord
								</InlineLink>
								{" • "}
								<InlineLink highlight={false} href={urls.socials.twitter}>
									Twitter
								</InlineLink>
							</div>
							<footer>
								©
								{" "}
								{new Date().getFullYear()}
								{" "}
								Flirtual
								{" "}
								<span className="text-sm opacity-75">
									{gitCommitSha?.slice(0, 6)}
									{" "}
									(
									{environment}
									)
								</span>
							</footer>
						</div>
					</DialogBody>
				</>
			</DrawerOrDialog>
		</>
	);
}
