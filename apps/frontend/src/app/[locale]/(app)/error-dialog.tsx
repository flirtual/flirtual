import { captureException } from "@sentry/react";
import { Chrome, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { m } from "motion/react";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import useSound from "use-sound";

import { Button } from "~/components/button";
import { CopyClick } from "~/components/copy-click";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { Image } from "~/components/image";
import { gitCommitSha, maintenance } from "~/const";
import { urls } from "~/urls";

export type ErrorWithDigest = { digest?: string } & Error;

export interface ErrorProps { error: ErrorWithDigest; reset: () => void };

const ErrorDetails: FC<{ digest?: string; eventId?: string }> = ({ digest, eventId }) => {
	const { t } = useTranslation();

	return (
		<>
			{digest && (
				<CopyClick value={digest}>
					<span>
						<Trans
							components={{
								strong: <strong className="font-bold" />
							}}
							i18nKey="zany_watery_zebra_play"
							values={{ value: digest }}
						/>
					</span>
				</CopyClick>
			)}
			{eventId && (
				<CopyClick value={eventId}>
					<span>
						<Trans
							components={{
								strong: <strong className="font-bold" />
							}}
							i18nKey="big_that_insect_slurp"
							values={{ value: eventId }}
						/>
					</span>
				</CopyClick>
			)}
		</>
	);
};

export type ErrorDialogProps = { userId?: string } & ErrorProps;

const errors = new Map<string, number>();

export const ErrorDialog: FC<ErrorDialogProps> = ({ error, reset }) => {
	// Bail out to the Next.js error dialog in development, more useful for debugging.
	// if (environment === "development") throw error;

	const { t } = useTranslation();

	const errorKey = error.digest || error.message;

	const eventId = useMemo(() => captureException(error, { tags: { digest: error.digest } }), [error]);
	// const [squeak] = useSound(urls.media("squeak.mp3"));

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
	}, [errorKey, throwCount]);

	return (
		<DrawerOrDialog
			open
			className="desktop:max-w-lg"
			onOpenChange={(open) => {
				if (open) return;
				tryAgain();
			}}
		>
			{maintenance
				? (
						<>
							<DialogHeader>
								<DialogTitle>Flirtual is temporarily unavailable</DialogTitle>
								<DialogDescription className="sr-only" />
							</DialogHeader>
							<DialogBody className="flex flex-col">
								<div className="relative flex gap-8">
									<Image
										priority
										alt=""
										className="pettable mt-5 h-8 w-fit shrink-0 rotate-[10deg] desktop:mt-1 desktop:h-12"
										draggable={false}
										height={345}
										src={urls.media("b25d8377-7035-4a23-84f1-faa095fa8104")}
										width={412}
										// onClick={() => squeak()}
									/>
									<m.div
										animate={{ scale: 1, opacity: 1 }}
										className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80"
										initial={{ scale: 0.8, opacity: 0.5 }}
									>
										<div
											className="absolute -left-5 top-7 size-5 bg-white-10"
											style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
										/>
										<p>
											Flirtual is temporarily offline for scheduled maintenance. We'll be right back&mdash;check back soon!
										</p>
									</m.div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										autoFocus
										className="w-fit"
										size="sm"
										onClick={tryAgain}
									>
										Refresh
									</Button>
								</div>
								<div className="mt-auto flex flex-col">
									<div className="flex gap-2">
										<a href={urls.resources.networkStatus}>
											{t("network_status")}
										</a>
										{" • "}
										<a href={urls.landing}>
											Home
										</a>
										{" • "}
										<a href={urls.socials.discord}>
											{t("discord")}
										</a>
										{" • "}
										<a href={urls.resources.contact}>
											{t("support")}
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
					)
				: (
						<>
							<DialogHeader>
								<DialogTitle>{t("each_aloof_parrot_dine")}</DialogTitle>
								<DialogDescription className="sr-only" />
							</DialogHeader>
							<DialogBody className="flex flex-col">
								<CopyClick value={eventId}>{eventId}</CopyClick>
								<div className="select-children relative flex gap-8 ">
									<Image
										priority
										alt=""
										className="pettable mt-5 h-8 w-fit shrink-0 rotate-[10deg] desktop:mt-1 desktop:h-12"
										draggable={false}
										height={345}
										src={urls.media("b25d8377-7035-4a23-84f1-faa095fa8104")}
										width={412}
										// onClick={() => squeak()}
									/>
									<m.div
										animate={{ scale: 1, opacity: 1 }}
										className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80"
										initial={{ scale: 0.8, opacity: 0.5 }}
									>
										<div
											className="absolute -left-5 top-7 size-5 bg-white-10"
											style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
										/>
										<p>{t("quiet_quaint_whale_rest")}</p>
										<pre className="whitespace-pre-wrap text-xs">
											{error.message}
										</pre>
									</m.div>
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
										<Trans
											components={{
												"browser-icon": <Chrome className="mr-1 inline-block size-4 shrink-0" />,
												"device-icon": <Smartphone className="mr-0.5 inline-block size-4 shrink-0" />
											}}
											i18nKey={native ? "sweet_strong_poodle_endure" : "heroic_pink_gull_breathe"}
										/>
									</li>
									<li>
										<Trans
											components={{
												icon: <WifiOff className="mr-1 inline-block size-4 shrink-0" />,
											}}
											i18nKey="tough_sleek_wasp_reside"
										/>
									</li>
									<li>
										<Trans
											components={{
												contact: (
													<a
														className="whitespace-nowrap lowercase underline"
														href={urls.resources.contact}
													>
														<Send className="mr-1 inline-block size-4 shrink-0" />
													</a>
												)
											}}
											i18nKey="yummy_salty_porpoise_greet"
										/>

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
								</div>
								<div className="mt-auto flex flex-col">
									<div className="flex gap-2">
										<a href={urls.resources.networkStatus}>
											{t("network_status")}
										</a>
										{" • "}
										<a href={urls.landing}>
											Home
										</a>
										{" • "}
										<a href={urls.socials.discord}>
											{t("discord")}
										</a>
										{" • "}
										<a href={urls.resources.contact}>
											{t("support")}
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
					)}
		</DrawerOrDialog>
	);
};
