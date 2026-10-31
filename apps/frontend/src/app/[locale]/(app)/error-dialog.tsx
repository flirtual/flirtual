import { captureException } from "@sentry/react-router";
import { AppWindow, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { m } from "motion/react";
import type { FC } from "react";
import { Fragment, useCallback, useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import * as brand from "~/brand";
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
import { maintenance, version } from "~/const";
import FlittyHardhat from "~/static/mascot-hardhat.png";
import { urls } from "~/urls";

export type ErrorWithDigest = { digest?: string } & Error;

export interface ErrorProps { error: ErrorWithDigest; reset: () => void };

const ErrorDetails: FC<{ digest?: string; eventId?: string }> = ({ digest, eventId }) => {
	return (
		<>
			{digest && (
				<CopyClick value={digest}>
					<span>
						<Trans
							components={{
								strong: <strong className="font-bold" />
							}}
							i18nKey="error_digest"
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
							i18nKey="error_event"
							values={{ value: eventId }}
						/>
					</span>
				</CopyClick>
			)}
		</>
	);
};

const ErrorLinks: FC = () => {
	const { t } = useTranslation();

	const links = [
		{ href: urls.resources.networkStatus, label: t("network_status") },
		{ href: urls.landing, label: "Home" },
		{ href: urls.socials.discord, label: t("discord") },
		{ href: urls.resources.contact, label: t("support") }
	].filter((link): link is { href: string; label: string } => !!link.href);

	return (
		<div className="flex gap-2">
			{links.map(({ href, label }, index) => (
				<Fragment key={href}>
					{index > 0 && " • "}
					<a href={href}>{label}</a>
				</Fragment>
			))}
		</div>
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

	const native = navigator.userAgent.includes(brand.nativeUserAgent) || navigator.userAgent.includes(brand.visionUserAgent);

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
								<DialogTitle>{t("maintenance_title", { name: brand.name })}</DialogTitle>
								<DialogDescription className="sr-only" />
							</DialogHeader>
							<DialogBody className="flex flex-col">
								<div className="relative flex gap-8">
									<Image
										priority
										alt=""
										className="mt-5 h-8 w-fit shrink-0 pettable rotate-10 desktop:mt-1 desktop:h-12"
										draggable={false}
										height={345}
										src={FlittyHardhat}
										width={412}
										// onClick={() => squeak()}
									/>
									<m.div
										animate={{ scale: 1, opacity: 1 }}
										className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80"
										initial={{ scale: 0.8, opacity: 0.5 }}
									>
										<div
											className="absolute top-7 -left-5 size-5 bg-white-10"
											style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
										/>
										<p>{t("maintenance_description", { name: brand.name })}</p>
									</m.div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										autoFocus
										className="w-fit"
										size="sm"
										onClick={tryAgain}
									>
										{t("refresh")}
									</Button>
								</div>
								<div className="mt-auto flex flex-col">
									<ErrorLinks />
									<footer>
										<span>{t("copyright", { year: new Date().getFullYear() })}</span>
										{" "}
										<span className="text-sm opacity-75">{version}</span>
									</footer>
								</div>
							</DialogBody>
						</>
					)
				: (
						<>
							<DialogHeader>
								<DialogTitle>{t("error_title")}</DialogTitle>
								<DialogDescription className="sr-only" />
							</DialogHeader>
							<DialogBody className="flex flex-col">
								<CopyClick value={eventId}>{eventId}</CopyClick>
								<div className="relative flex gap-8 select-children ">
									<Image
										priority
										alt=""
										className="mt-5 h-8 w-fit shrink-0 pettable rotate-10 desktop:mt-1 desktop:h-12"
										draggable={false}
										height={345}
										src={FlittyHardhat}
										width={412}
										// onClick={() => squeak()}
									/>
									<m.div
										animate={{ scale: 1, opacity: 1 }}
										className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80"
										initial={{ scale: 0.8, opacity: 0.5 }}
									>
										<div
											className="absolute top-7 -left-5 size-5 bg-white-10"
											style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
										/>
										<p>{t("error_found")}</p>
										<pre className="text-xs whitespace-pre-wrap">
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
									{native && (<li>{t("error_tip_restart_app")}</li>)}
									<li>
										<Trans
											components={{
												"browser-icon": <AppWindow className="mr-1 inline-block size-4 shrink-0" />,
												"device-icon": <Smartphone className="mr-0.5 inline-block size-4 shrink-0" />
											}}
											i18nKey={native ? "error_tip_update_app" : "error_tip_update_browser"}
										/>
									</li>
									<li>
										<Trans
											components={{
												icon: <WifiOff className="mr-1 inline-block size-4 shrink-0" />,
											}}
											i18nKey="error_tip_connection"
										/>
									</li>
									{urls.resources.contact && (
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
												i18nKey="error_tip_contact"
											/>
										</li>
									)}
								</ul>
								<div data-vaul-no-drag className="flex max-w-sm flex-col font-mono text-xs whitespace-pre-wrap select-children">
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
									<ErrorLinks />
									<footer>
										<span>{t("copyright", { year: new Date().getFullYear() })}</span>
										{" "}
										<span className="text-sm opacity-75">{version}</span>
									</footer>
								</div>
							</DialogBody>
						</>
					)}
		</DrawerOrDialog>
	);
};
