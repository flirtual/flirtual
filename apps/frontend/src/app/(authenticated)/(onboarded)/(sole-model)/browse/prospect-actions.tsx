/* eslint-disable require-atomic-updates */
"use client";

import { animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { Undo2, X } from "lucide-react";
import dynamic from "next/dynamic";

import { api } from "~/api";
import { Button } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { useTour } from "~/hooks/use-tour";
import { useLocation } from "~/hooks/use-location";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import {
	DialogBody,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";

import { Countdown } from "./countdown";

import type { User } from "~/api/user";
import type {
	ProspectKind,
	ProspectRespondType,
	RespondProspectBody
} from "~/api/matchmaking";

const Key = (props: { label: string }) => {
	return (
		<kbd className="mb-0.5 inline-block size-7 rounded-md bg-white-20 pt-0.5 text-center font-nunito font-bold text-black-60 shadow-[0_1px_1px_2px_rgba(255,255,255,0.75)] dark:bg-black-60 dark:text-white-20 dark:shadow-[0_1px_1px_2px_rgba(0,0,0,0.65)]">
			{props.label}
		</kbd>
	);
};

export const _ProspectActions: FC<{
	prospect: User;
	kind: ProspectKind;
	likesLeft?: boolean;
	passesLeft?: boolean;
}> = ({ prospect, kind, likesLeft = false, passesLeft = false }) => {
	const toasts = useToast();
	const router = useRouter();

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

	useTour(
		"browsing",
		useCallback(
			({ next, back, cancel }) => [
				{
					id: "introduction",
					title: "Flirtual Tutorial",
					text: `
					Take a quick tour with us! We can't wait to introduce you to some amazing people :)
					`,
					buttons: [
						{
							text: "Exit",
							action: cancel
						},
						{
							classes: "primary shadow-brand-1",
							text: "Continue",
							action: next
						}
					]
				},
				{
					id: "like",
					title: "Like their profile?",
					text: "Press the <b>Like button</b>! If they like you back, you'll match.",
					attachTo: { element: "#like-button", on: "top" },
					modalOverlayOpeningRadius: 33
				},
				{
					id: "friend",
					title: "Like their profile?",
					text: "Or press the <b>Homie button</b> if you want to be friends. You'll still match if it's mutual whether you Like or Homie each other.",
					attachTo: { element: "#friend-button", on: "top" },
					modalOverlayOpeningRadius: 33
				},
				{
					id: "pass",
					title: "Not interested?",
					text: "Press the <b>Pass button</b> to move on to the next profile.",
					attachTo: { element: "#pass-button", on: "top" },
					modalOverlayOpeningRadius: 26
				},
				{
					id: "undo",
					title: "Changed your mind?",
					text: "Press <b>Undo</b> to go back and see the last profile.",
					attachTo: { element: "#undo-button", on: "top" },
					modalOverlayOpeningRadius: 26
				},
				{
					id: "conversations",
					title: "Shoot your shot!",
					text: "View your matches here. Message them and meet up in VR!",
					attachTo: { element: "#conversation-button", on: "top" },
					modalOverlayOpeningRadius: 20,
					modalOverlayOpeningPadding: 4
				},
				{
					id: "browse-mode",
					title: "Looking for something else?",
					text: `
					Switch between <b>Date Mode</b> and <b>Homie Mode</b> (without matchmaking filters) to see more profiles.<br/><br/>
					Each day, you can browse up to <b>30 profiles</b> and Like or Homie up to 15 of them in each mode.`,
					attachTo: { element: "#browse-mode-switch", on: "top" },
					modalOverlayOpeningRadius: 33
				},
				{
					id: "profile-dropdown",
					title: "Customize your experience!",
					text: "Here you can <b>update your profile</b>, or subscribe to Premium to browse unlimited profiles and see who likes you before you match.",
					attachTo: { element: "#profile-dropdown-button", on: "top" },
					modalOverlayOpeningRadius: 20,
					modalOverlayOpeningPadding: 4
				},
				{
					id: "conclusion",
					title: "Thank you!",
					text: `
					That concludes our tutorial! We hope you have a great time here, and remember to treat each other kindly.<br/><br/>
					Don't forget to drink water and take breaks as needed!<br/><br/>
					&lt;3<br/>
					The Flirtual Team`,
					modalOverlayOpeningRadius: 20,
					modalOverlayOpeningPadding: 4,
					buttons: [
						{
							text: "Back",
							action: back
						},
						{
							classes: "primary shadow-brand-1",
							text: "Start matching",
							action: next
						}
					]
				}
			],
			[]
		),
		{
			defaultStart: true
		}
	);

	const respond = useCallback(
		async (type: ProspectRespondType, _kind: ProspectKind) => {
			if (pending.current || lastResponseTime.current > Date.now() - 800)
				return;

			pending.current = true;
			lastResponseTime.current = Date.now();

			const body = {
				type,
				kind: _kind,
				mode: kind,
				userId: prospect.id
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
				const respondResponse = await api.matchmaking.respondProspect({
					body
				});

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
		[kind, likesLeft, passesLeft, prospect.id, router, toasts]
	);

	const respondReverse = useCallback(async () => {
		if (!lastProfile) return;
		const { userId, kind } = lastProfile;

		await api.matchmaking
			.reverseRespondProspect({
				body: { userId, kind }
			})
			.catch(toasts.addError)
			.finally(() => {
				setLastProfile(null);
				router.refresh();
			});
	}, [router, lastProfile, toasts.addError]);

	const onCountdownFinish = useCallback(() => {
		setActionDialog(null);
		router.refresh();
	}, [router]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "h") void respondReverse();
			if (event.key === "j") void respond("like", kind);
			if (event.key === "k") void respond("like", "friend");
			if (event.key === "l") void respond("pass", kind);
		},
		[kind, respond, respondReverse]
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

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
									onClick={respondReverse}
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
											onClick={() => respond("like", kind)}
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
										onClick={() => respond("like", "friend")}
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
									onClick={() => respond("pass", kind)}
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

			{actionDialog && (
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
			)}
		</>
	);
};

export const ProspectActions = dynamic(
	() => Promise.resolve(_ProspectActions),
	{ ssr: false }
);
