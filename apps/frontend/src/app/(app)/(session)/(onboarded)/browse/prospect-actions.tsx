"use client";

import { animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Undo2, X } from "lucide-react";
import dynamic from "next/dynamic";
import ms from "ms";
import { InAppReview } from "@capacitor-community/in-app-review";
import useMutation from "swr/mutation";

import { Button } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { useDefaultTour, useTour } from "~/hooks/use-tour";
import { useLocation } from "~/hooks/use-location";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import {
	DialogBody,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import {
	Matchmaking,
	type ProspectKind,
	type ProspectRespondType,
	type RespondProspectBody
} from "~/api/matchmaking";
import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { useUser } from "~/hooks/use-user";
import { queueKey } from "~/hooks/use-queue";

import { Countdown } from "./countdown";

const Key = (props: { label: string }) => {
	return (
		<kbd className="mb-0.5 inline-block size-7 rounded-md bg-white-20 pt-0.5 text-center font-nunito font-bold text-black-60 shadow-[0_1px_1px_2px_rgba(255,255,255,0.75)] dark:bg-black-60 dark:text-white-20 dark:shadow-[0_1px_1px_2px_rgba(0,0,0,0.65)]">
			{props.label}
		</kbd>
	);
};

export const _ProspectActions: FC<{
	userId: string;
	kind: ProspectKind;
	likesLeft?: boolean;
	passesLeft?: boolean;
}> = ({ userId, kind, likesLeft = false, passesLeft = false }) => {
	const toasts = useToast();
	const router = useRouter();
	const [session] = useSession();
	const user = useUser(userId);

	const [actionDialog, setActionDialog] = useState<{
		message: string;
		resetAt?: string;
	} | null>(null);
	const [lastProfile, setLastProfile] = useState<RespondProspectBody | null>(
		null
	);

	const pending = useRef(false);
	const lastResponseTime = useRef(0);

	const location = useLocation();

	useEffect(() => {
		setActionDialog(null);
	}, [location.href]);

	useEffect(() => {
		if (!session?.user.createdAt) return;

		const ratingPrompts = session.user.ratingPrompts;
		const monthsRegistered = Math.floor(
			(Date.now() - new Date(session.user.createdAt).getTime()) / ms("30d")
		);

		if (
			(monthsRegistered >= 1 && ratingPrompts === 0) ||
			(monthsRegistered >= 3 && ratingPrompts === 1) ||
			(monthsRegistered >= 6 && ratingPrompts === 2)
		) {
			void InAppReview.requestReview();
			void User.updateRatingPrompts(session.user.id, {
				ratingPrompts: monthsRegistered >= 6 ? 3 : monthsRegistered >= 3 ? 2 : 1
			});
		}
	}, [session?.user.createdAt]);

	useDefaultTour();

	/*
	const respond = useCallback(
		async (type: ProspectRespondType, _kind: ProspectKind) => {
			if (
				!user ||
				pending.current ||
				lastResponseTime.current > Date.now() - 800
			)
				return;

			pending.current = true;
			lastResponseTime.current = Date.now();

			const body = {
				type,
				kind: _kind,
				mode: kind,
				userId: user.id
			};

			const doAnimation =
				(type === "like" && likesLeft) || (type === "pass" && passesLeft);

			window.scrollTo({ top: 0, behavior: "smooth" });

			if (doAnimation)
				await animate([
					[
						"#current-profile",
						{ opacity: 1, position: "relative" },
						{ duration: 0, at: 0 }
					],
					[
						"#next-profile",
						{ opacity: 0, position: "absolute" },
						{ duration: 0, at: 0 }
					]
				]);

			const animation = doAnimation
				? animate(
						[
							[
								"#current-profile",
								{ opacity: 0, position: "absolute" },
								{ duration: 0.25 }
							],
							[
								"#next-profile",
								{ opacity: 1, display: "flex", position: "relative" },
								{ duration: 0.5, at: "<" }
							]
						],
						{}
					)
				: null;

			try {
				const respondResponse = await Matchmaking.respondProspect(body);

				if (respondResponse.success === false) {
					switch (respondResponse.message) {
						case "out_of_likes": {
							animation?.cancel();
							setActionDialog({
								message: "You are out of likes for today :(",
								resetAt: respondResponse.resetAt
							});
							break;
						}
						case "out_of_passes": {
							animation?.cancel();
							setActionDialog({
								message: "You are out of profiles for today :(",
								resetAt: respondResponse.resetAt
							});
							break;
						}
						case "already_responded": {
							router.refresh();
							pending.current = false;
							return;
						}
						default: {
							animation?.cancel();
							toasts.add({
								type: "error",
								value: "Error responding to profile."
							});
							break;
						}
					}

					router.refresh();
					pending.current = false;

					return;
				}

				setLastProfile(body);
				pending.current = false;

				router.refresh();
			} catch (reason) {
				toasts.addError(reason);
				pending.current = false;
				router.refresh();
			}
		},
		[kind, likesLeft, passesLeft, user, router, toasts]
	);

	const respondReverse = useCallback(async () => {
		if (!lastProfile) return;
		const { userId, kind } = lastProfile;

		await Matchmaking.reverseRespondProspect({ userId, kind })
			.catch(toasts.addError)
			.finally(() => {
				setLastProfile(null);
				router.refresh();
			});
	}, [router, lastProfile, toasts.addError]);*/

	const { trigger } = useMutation(
		queueKey(kind),
		(
			_,
			{
				arg: { type, kind }
			}: {
				arg: {
					type: ProspectRespondType | "undo";
					kind: ProspectKind;
				};
			}
		) => {
			if (type === "undo") {
				return Matchmaking.reverseRespondProspect({
					userId,
					kind
				});
			}

			return Matchmaking.respondProspect({
				kind,
				type,
				userId
			});
		},
		{
			throwOnError: false
		}
	);

	const onCountdownFinish = useCallback(() => {
		setActionDialog(null);
		router.refresh();
	}, [router]);

	useGlobalEventListener(
		"document",
		"keydown",
		useCallback(
			(event) => {
				if (document.querySelector("[data-radix-focus-guard]") || event.ctrlKey)
					return;

				// if (event.key === "h") void respondReverse();
				// if (event.key === "j") void respond("like", kind);
				// if (event.key === "k") void respond("like", "friend");
				// if (event.key === "l") void respond("pass", kind);
				event.preventDefault();
			},
			[kind]
		)
	);

	return (
		<>
			<div className="h-[5.5rem] w-full desktop:h-0">
				<div className="pointer-events-none fixed bottom-[max(calc(env(safe-area-inset-bottom,0rem)+3.375rem),4.5rem)] left-0 flex w-full flex-col items-center justify-center gap-3 px-2 pb-4 vision:bottom-2 desktop:bottom-0 desktop:py-8">
					<div className="pointer-events-auto flex items-center gap-1.5 overflow-hidden rounded-xl py-2 text-white-10 desktop:gap-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 disabled:cursor-not-allowed disabled:brightness-[0.25]"
									disabled={!lastProfile}
									id="undo-button"
									type="button"
									// onClick={respondReverse}
								>
									<Undo2 className="size-7" strokeWidth={3} />
								</button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">Undo</span>
								<Key label="H" />
							</TooltipContent>
						</Tooltip>
						<div className="flex flex-row items-center gap-1.5 desktop:gap-3">
							{kind === "love" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											className="flex items-center justify-center rounded-full bg-brand-gradient p-4 shadow-brand-1 transition-all disabled:brightness-50"
											id="like-button"
											type="button"
											onClick={() => trigger({ type: "like", kind })}
										>
											<HeartIcon
												className="w-[2.125rem] shrink-0"
												gradient={false}
											/>
										</button>
									</TooltipTrigger>
									<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
										<span className="pt-1">Like</span>
										<Key label="J" />
									</TooltipContent>
								</Tooltip>
							)}
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="flex items-center justify-center rounded-full bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 p-4 shadow-brand-1 transition-all disabled:brightness-50"
										id="friend-button"
										type="button"
										// onClick={() => respond("like", "friend")}
									>
										<PeaceIcon
											className="w-[2.125rem] shrink-0"
											gradient={false}
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
									<span className="pt-1">Homie</span>
									<Key label={kind === "love" ? "K" : "J"} />
								</TooltipContent>
							</Tooltip>
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:brightness-50"
									id="pass-button"
									type="button"
									// onClick={() => respond("pass", kind)}
								>
									<X className="size-7" strokeWidth={3} />
								</button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">Pass</span>
								<Key label="L" />
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
			{/* <UpsellDialog/> */}
		</>
	);
};

export const ProspectActions = dynamic(
	() => Promise.resolve(_ProspectActions),
	{ ssr: false }
);

const UpsellDialog: FC = () => {
	return (
		<DrawerOrDialog open>
			<>
				<DialogHeader>
					<DialogTitle>{actionDialog.message}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<div className="flex min-h-96 flex-col justify-between gap-4 px-2 desktop:max-w-sm">
						{kind === "love" ? (
							<>
								<div className="flex flex-col gap-4">
									<div className="flex max-w-md flex-col gap-4 font-nunito">
										<p>
											You can{" "}
											<InlineLink href={urls.subscription.default}>
												upgrade to Premium
											</InlineLink>{" "}
											to <em>browse unlimited profiles</em> and{" "}
											<em>see who&apos;s already liked you</em>.
										</p>
										<p>
											You can also continue in{" "}
											<InlineLink href={urls.browse("friend")}>
												Homie Mode
											</InlineLink>
											, where you can meet new friends (without matchmaking
											filters).
										</p>
										{actionDialog.resetAt && (
											<p className="font-semibold">
												New profiles in{" "}
												<Countdown
													date={actionDialog.resetAt}
													onFinish={onCountdownFinish}
												/>
											</p>
										)}
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Button
										size="sm"
										onClick={() => {
											router.push(urls.subscription.default);
										}}
									>
										Get Premium
									</Button>
									<Button
										kind="secondary"
										size="sm"
										onClick={() => {
											router.push(urls.browse("friend"));
										}}
									>
										Homie Mode
									</Button>
									<Button
										kind="tertiary"
										size="sm"
										onClick={() => setActionDialog(null)}
									>
										Dismiss
									</Button>
								</div>
							</>
						) : (
							<>
								<div className="flex flex-col gap-4">
									<h1 className="max-w-sm font-montserrat text-xl font-bold tracking-tight">
										{actionDialog.message}
									</h1>
									<div className="flex flex-col gap-4">
										<div className="h-1 w-1/2 rounded-full bg-brand-gradient" />
										<div className="flex max-w-md flex-col gap-4 font-nunito">
											<p>
												You can{" "}
												<InlineLink href={urls.subscription.default}>
													upgrade to Premium
												</InlineLink>{" "}
												to <em>browse unlimited profiles</em> and{" "}
												<em>see who&apos;s already liked you</em>.
											</p>
											{actionDialog.resetAt && (
												<p className="font-semibold">
													New profiles in{" "}
													<Countdown
														date={actionDialog.resetAt}
														onFinish={onCountdownFinish}
													/>
												</p>
											)}
										</div>
										<div className="h-1 w-2/12 rounded-full bg-brand-gradient" />
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Button
										size="sm"
										onClick={() => {
											router.push(urls.subscription.default);
										}}
									>
										Get Premium
									</Button>
									<Button
										kind="secondary"
										size="sm"
										onClick={() => {
											router.push(urls.browse());
										}}
									>
										Leave Homie Mode
									</Button>
									<Button
										kind="tertiary"
										size="sm"
										onClick={() => setActionDialog(null)}
									>
										Dismiss
									</Button>
								</div>
							</>
						)}
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
