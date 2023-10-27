/* eslint-disable require-atomic-updates */
"use client";

import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import {
	ProspectKind,
	ProspectRespondType,
	RespondProspectBody
} from "~/api/matchmaking";
import { User } from "~/api/user";
import { Button } from "~/components/button";
import { DrawerOrModal } from "~/components/drawer-or-modal";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { useTour } from "~/hooks/use-tour";

import { Countdown } from "./countdown";

export const ProspectActions: FC<{
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

	const tour = useTour(
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
							classes: "primary",
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
					modalOverlayOpeningRadius: 12
				},
				{
					id: "friend",
					title: "Like their profile?",
					text: "Or press the <b>Homie button</b> if you want to be friends. You'll still match if it's mutual whether you Like or Homie each other.",
					attachTo: { element: "#friend-button", on: "top" },
					modalOverlayOpeningRadius: 12
				},
				{
					id: "pass",
					title: "Not interested?",
					text: "Press the <b>Pass button</b> to move on to the next profile.",
					attachTo: { element: "#pass-button", on: "top" },
					modalOverlayOpeningRadius: 12
				},
				{
					id: "undo",
					title: "Changed your mind?",
					text: "Press <b>Undo</b> to go back and see the last profile.",
					attachTo: { element: "#undo-button", on: "top" },
					modalOverlayOpeningRadius: 12
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
							classes: "primary",
							text: "Start matching",
							action: next
						}
					]
				}
			],
			[]
		)
	);

	useEffect(() => {
		tour.start();
	}, [tour]);

	const respond = async (type: ProspectRespondType, _kind: ProspectKind) => {
		if (pending.current || lastResponseTime.current > Date.now() - 1200) return;

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
	};

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

	return (
		<>
			<div className="h-32 w-full dark:bg-black-70 sm:h-0">
				<div className="pointer-events-none fixed bottom-0 left-0 flex w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent to-black-90/50 px-2 py-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
					{/* <div className="pointer-events-auto flex items-center gap-3 overflow-hidden rounded-xl text-white-10">
					<Tooltip>
						<LetterDialog>
							<TooltipTrigger asChild>
								<DialogTrigger asChild>
									<button
										className="flex max-w-[20vw] items-center justify-center gap-3 rounded-xl bg-gradient-to-tr from-[#72b9bf] to-[#4d6c88] px-6 py-4 shadow-brand-1"
										id="letter-button"
										type="button"
									>
										<EnvelopeIcon className="w-8 shrink-0" />
										<span className="hidden select-none font-montserrat text-lg font-extrabold md:inline">
											Send letter
										</span>
									</button>
								</DialogTrigger>
							</TooltipTrigger>
						</LetterDialog>
						<TooltipContent>0 envelopes</TooltipContent>
					</Tooltip>
				</div> */}
					<div className="pointer-events-auto flex h-32 items-center gap-3 overflow-hidden rounded-xl pb-16 text-white-10">
						<Tooltip>
							<TooltipTrigger>
								<button
									className="flex h-fit max-w-[15vw] items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1 disabled:cursor-not-allowed disabled:brightness-50"
									disabled={!lastProfile}
									id="undo-button"
									type="button"
									onClick={respondReverse}
								>
									<ArrowUturnLeftIcon className="w-5" strokeWidth={3} />
								</button>
							</TooltipTrigger>
							<TooltipContent>Undo previous</TooltipContent>
						</Tooltip>
						{kind === "love" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="flex max-w-[20vw] items-center justify-center gap-3 rounded-xl bg-brand-gradient px-6 py-4 shadow-brand-1 transition-all disabled:brightness-50 sm:w-40"
										id="like-button"
										type="button"
										onClick={() => respond("like", kind)}
									>
										<HeartIcon className="w-8 shrink-0" gradient={false} />
										<span className="hidden select-none font-montserrat text-lg font-extrabold md:inline">
											Like
										</span>
									</button>
								</TooltipTrigger>
								<TooltipContent>Like profile</TooltipContent>
							</Tooltip>
						)}
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									id="friend-button"
									type="button"
									className={twMerge(
										"flex max-w-[20vw] items-center justify-center gap-3 rounded-xl bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 px-6 py-4 shadow-brand-1 transition-all disabled:brightness-50",
										kind === "friend" && "w-40"
									)}
									onClick={() => respond("like", "friend")}
								>
									<PeaceIcon className="w-8 shrink-0" gradient={false} />
									<span className="hidden select-none font-montserrat text-lg font-extrabold md:inline">
										Homie
									</span>
								</button>
							</TooltipTrigger>
							<TooltipContent>Friend profile</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex h-fit max-w-[15vw] items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1 transition-all disabled:brightness-50"
									id="pass-button"
									type="button"
									onClick={() => respond("pass", kind)}
								>
									<XMarkIcon className="w-5" strokeWidth={3} />
								</button>
							</TooltipTrigger>
							<TooltipContent>Pass profile</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>

			{actionDialog && (
				<DrawerOrModal visible>
					<div className="flex min-h-[24rem] flex-col justify-between gap-4 px-2 sm:max-w-sm">
						{kind === "love" ? (
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
				</DrawerOrModal>
			)}
		</>
	);
};
