import { Clipboard } from "@capacitor/clipboard";
import { Slot } from "@radix-ui/react-slot";
import { captureException, captureFeedback, setUser } from "@sentry/nextjs";
import { Chrome, MoveRight, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { FC, PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSound from "use-sound";

import { Button } from "~/components/button";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { InputLabel, InputTextArea } from "~/components/inputs";
import { environment, gitCommitSha } from "~/const";
import { urls } from "~/urls";

export type ErrorWithDigest = { digest?: string } & Error;

export interface ErrorProps { error: ErrorWithDigest; reset: () => void };

/**
 * An re-implemented version of the CopyClick component from `~/components/copy-click` that doesn't
 * use the APIs which aren't available when rendering the global-error page.
 */
const CopyClick: FC<PropsWithChildren<{ value: string }>> = ({ value, children }) => (
	<Slot
		data-copy-click
		className="cursor-pointer"
		onClick={() => Clipboard.write({ string: value })}
	>
		{children}
	</Slot>
);

const ErrorDetails: FC<{ digest?: string; eventId?: string }> = ({ digest, eventId }) => {
	const t = useTranslations();

	return (
		<>
			{digest && (
				<CopyClick value={digest}>
					<span>
						{t.rich("zany_watery_zebra_play", {
							value: digest,
							strong: (children) => <strong className="font-bold">{children}</strong>
						})}
					</span>
				</CopyClick>
			)}
			{eventId && (
				<CopyClick value={eventId}>
					<span>
						{t.rich("big_that_insect_slurp", {
							value: eventId,
							strong: (children) => <strong className="font-bold">{children}</strong>
						})}
					</span>
				</CopyClick>
			)}
		</>
	);
};

export type ErrorDialogProps = { userId?: string } & ErrorProps;

const errors = new Map<string, number>();

export const ErrorDialog: FC<ErrorDialogProps> = ({ error, userId, reset }) => {
	const t = useTranslations();

	const errorKey = error.digest || error.message;

	const eventId = useMemo(() => captureException(error, { tags: { digest: error.digest } }), [error]);
	const [squeak] = useSound(urls.media("squeak.mp3"));

	const [addDetails, setAddDetails] = useState(false);
	const throwCount = (errors.get(errorKey) || 0) + 1;

	const native = navigator.userAgent.includes("Flirtual-Native") || navigator.userAgent.includes("Flirtual-Vision");

	const tryAgain = useCallback(() => {
		if (throwCount >= 4) {
			location.reload();
			return;
		}

		reset();
	}, [throwCount, reset]);

	useEffect(() => {
		errors.set(errorKey, throwCount);

		// Maybe recover from error automatically?
		if (throwCount === 1) tryAgain();
	}, [errorKey, throwCount, tryAgain]);

	return (
		<DrawerOrDialog
			open
			className="desktop:max-w-lg"
			onOpenChange={(open) => {
				if (open) return;
				tryAgain();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>{t("each_aloof_parrot_dine")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody className="flex flex-col">
					{addDetails
						? (
								<>
									<p>{t("seemly_busy_vulture_skip")}</p>
									<div data-vaul-no-drag className="select-children flex flex-col whitespace-pre-wrap font-mono text-xs">
										<span className="mb-2 font-bold">{t("odd_dull_turkey_grip")}</span>
										<ErrorDetails digest={error.digest} eventId={eventId} />
										<span className="mt-2">{error.message}</span>
									</div>
									<form
										className="flex flex-col gap-4"
										onSubmit={async ({ currentTarget: { elements } }) => {
											const message = (elements.namedItem("message") as HTMLTextAreaElement).value;
											if (userId) setUser({ id: userId });

											captureFeedback(
												{
													message,
													associatedEventId: eventId,
												},
												{
													includeReplay: true,
													originalException: error
												}
											);
										}}
									>
										<div className="flex flex-col gap-2">
											<InputLabel>
												{t("sunny_giant_cougar_taste")}
											</InputLabel>
											<InputTextArea name="message" rows={5} />
										</div>
										<div className="flex gap-2">
											<Button
												className="w-fit"
												kind="secondary"
												size="sm"
												type="submit"
											>
												{t("submit")}
											</Button>
											<Button
												className="w-fit px-2"
												kind="tertiary"
												size="sm"
												onClick={() => setAddDetails(false)}
											>
												{t("back")}
												<MoveRight className="ml-2 size-5 shrink-0" />
											</Button>
										</div>
									</form>
								</>
							)
						: (
								<>
									<CopyClick value={eventId}>{eventId}</CopyClick>
									<div className="relative flex gap-8">
										<Image
											priority
											alt=""
											className="pettable mt-5 h-8 w-fit shrink-0 rotate-[10deg] desktop:mt-1 desktop:h-12"
											draggable={false}
											height={345}
											src={urls.media("b25d8377-7035-4a23-84f1-faa095fa8104")}
											width={412}
											onClick={() => squeak()}
										/>
										<motion.div
											animate={{ scale: 1, opacity: 1 }}
											className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80"
											initial={{ scale: 0.8, opacity: 0.5 }}
										>
											<div
												className="absolute -left-5 top-7 size-5 bg-white-10"
												style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
											/>
											<p>
												{t("quiet_quaint_whale_rest")}
											</p>
										</motion.div>
									</div>
									<ul className="ml-4 flex list-disc flex-col gap-2">
										<li>
											<button
												className="underline"
												type="button"
												onClick={() => location.reload()}
											>
												<RotateCw className="mr-1 inline-block size-4 shrink-0" />
												{t(native ? "refresh_the_app" : "refresh_the_page")}
											</button>
											.
										</li>
										{native && (<li>{t("game_vexed_goldfish_dash")}</li>)}
										<li>
											{t.rich(native ? "sweet_strong_poodle_endure" : "heroic_pink_gull_breathe", {
												"browser-icon": () => <Chrome className="mr-1 inline-block size-4 shrink-0" />,
												"device-icon": () => <Smartphone className="mr-0.5 inline-block size-4 shrink-0" />
											})}
										</li>
										<li>
											{t.rich("tough_sleek_wasp_reside", {
												icon: () => <WifiOff className="mr-1 inline-block size-4 shrink-0" />
											})}
										</li>
										<li>
											{t.rich("yummy_salty_porpoise_greet", {
												contact: (children) => (
													<a
														className="whitespace-nowrap lowercase underline"
														href={urls.resources.contact}
													>
														<Send className="mr-1 inline-block size-4 shrink-0" />
														{children}
													</a>
												)
											})}

										</li>
									</ul>
									<div data-vaul-no-drag className="select-children flex max-w-sm flex-col whitespace-pre-wrap font-mono text-xs">
										<ErrorDetails digest={error.digest} eventId={eventId} />
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											autoFocus
											className="w-fit"
											size="sm"
											onClick={tryAgain}
										>
											{t("try_again")}
										</Button>
										<Button
											className="w-fit px-2"
											kind="tertiary"
											size="sm"
											onClick={() => setAddDetails((addDetails) => !addDetails)}
										>
											{t("add_details")}
											<MoveRight className="ml-2 size-5 shrink-0" />
										</Button>
									</div>
								</>
							)}
					<div className="mt-auto flex flex-col">
						<div className="flex gap-2">
							<a href={urls.resources.networkStatus}>
								{t("network_status")}
							</a>
							{" • "}
							<a href={urls.socials.discord}>
								{t("discord")}
							</a>
							{" • "}
							<a href={urls.socials.twitter}>
								{t("twitter")}
							</a>
						</div>
						<footer>
							<span>{t("copyright", { year: new Date().getFullYear() })}</span>
							{" "}
							<span className="text-sm opacity-75">{gitCommitSha?.slice(0, 6)}</span>
						</footer>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
