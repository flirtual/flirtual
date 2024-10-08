"use client";

import { type FC, useCallback, useEffect } from "react";
import { Undo2, X } from "lucide-react";
import dynamic from "next/dynamic";
import ms from "ms";
import { InAppReview } from "@capacitor-community/in-app-review";
import useMutation from "swr/mutation";
import { match, P } from "ts-pattern";

import { Button, ButtonLink } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { urls } from "~/urls";
import { useDefaultTour } from "~/hooks/use-tour";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import {
	Matchmaking,
	type ProspectKind,
	type ProspectRespondType,
	type RespondProspectResponse
} from "~/api/matchmaking";
import { displayName, User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { useUser } from "~/hooks/use-user";
import { queueKey, useQueue } from "~/hooks/use-queue";
import { UserAvatar } from "~/components/user-avatar";

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
}> = ({ userId, kind: mode }) => {
	const [session] = useSession();

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

	const { data: queue } = useQueue(mode);
	const { trigger, reset, data } = useMutation(
		queueKey(mode),
		async (
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
			window.scrollTo({ top: 0, behavior: "smooth" });

			if (type === "undo") {
				return Matchmaking.undo({
					mode
				});
			}

			return Matchmaking.queueAction({
				userId,
				kind,
				mode,
				type
			});
		},
		{
			throwOnError: false,
			revalidate: false,
			populateCache: (value) => {
				if ("queue" in value) return value.queue;
			}
		}
	);

	const like = (kind: ProspectKind = "love") =>
		trigger(
			{ type: "like", kind },
			{
				optimisticData: (_value) => {
					const value = _value as unknown as RespondProspectResponse;

					if (value && Array.isArray(value)) {
						const newValue = [value[1], value[2], null];
						return newValue as unknown as RespondProspectResponse;
					}

					return value;
				}
			}
		);

	const pass = () =>
		trigger(
			{ type: "pass", kind: mode },
			{
				optimisticData: (_value) => {
					const value = _value as unknown as RespondProspectResponse;

					if (value && Array.isArray(value)) {
						const newValue = [value[1], value[2], null];
						return newValue as unknown as RespondProspectResponse;
					}

					return value;
				}
			}
		);

	const undo = () =>
		trigger(
			{ type: "undo", kind: mode },
			{
				optimisticData: (_value) => {
					const value = _value as unknown as RespondProspectResponse;

					if (value && Array.isArray(value)) {
						const newValue = [null, value[0], value[1]];
						return newValue as unknown as RespondProspectResponse;
					}

					return value;
				}
			}
		);

	useGlobalEventListener(
		"document",
		"keydown",
		useCallback(
			(event) => {
				if (document.querySelector("[data-radix-focus-guard]") || event.ctrlKey)
					return;

				if (event.key === "h") void undo();
				if (event.key === "j") void like();
				if (event.key === "k") void like("friend");
				if (event.key === "l") void pass();
				event.preventDefault();
			},
			[mode]
		)
	);

	return (
		<>
			{match(data)
				.with({ match: true }, ({ matchKind, userId }) => (
					<MatchDialog kind={matchKind} userId={userId} onClose={reset} />
				))
				.with(
					{ error: P.union("out_of_likes", "out_of_passes") },
					({ error, details: { resetAt } }) => (
						<DrawerOrDialog
							open
							onOpenChange={(open) => {
								if (!open) reset();
							}}
						>
							<>
								<DialogHeader>
									<DialogTitle>
										{error === "out_of_likes"
											? "Out of likes"
											: "Out of passes"}
									</DialogTitle>
									<DialogDescription className="sr-only" />
								</DialogHeader>
								<DialogBody>
									<div className="flex flex-col justify-between gap-4 px-2 desktop:max-w-sm">
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
												{mode === "love" && (
													<p>
														You can also continue in{" "}
														<InlineLink href={urls.browse("friend")}>
															Homie Mode
														</InlineLink>
														, where you can meet new friends (without
														matchmaking filters).
													</p>
												)}
												<p className="font-semibold">New profiles in</p>
												<Countdown date={resetAt} onComplete={reset} />
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<ButtonLink href={urls.subscription.default} size="sm">
												Get Premium
											</ButtonLink>
											<ButtonLink
												kind="tertiary"
												size="sm"
												href={
													mode === "love"
														? urls.browse("friend")
														: urls.browse()
												}
											>
												{mode === "love" ? "Homie Mode" : "Leave Homie Mode"}
											</ButtonLink>
										</div>
									</div>
								</DialogBody>
							</>
						</DrawerOrDialog>
					)
				)
				.otherwise(() => null)}
			<div className="h-[5.5rem] w-full desktop:h-0">
				<div className="pointer-events-none fixed bottom-[max(calc(env(safe-area-inset-bottom,0rem)+3.375rem),4.5rem)] left-0 flex w-full flex-col items-center justify-center gap-3 px-2 pb-4 vision:bottom-2 desktop:bottom-0 desktop:py-8">
					<div className="pointer-events-auto flex items-center gap-1.5 overflow-hidden rounded-xl py-2 text-white-10 desktop:gap-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1"
									disabled={!Array.isArray(queue) || !queue[0]}
									id="undo-button"
									type="button"
									onClick={undo}
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
							{mode === "love" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											className="flex items-center justify-center rounded-full bg-brand-gradient p-4 shadow-brand-1 transition-all disabled:brightness-50"
											id="like-button"
											type="button"
											onClick={() => like()}
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
										onClick={() => like("friend")}
									>
										<PeaceIcon
											className="w-[2.125rem] shrink-0"
											gradient={false}
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
									<span className="pt-1">Homie</span>
									<Key label={mode === "love" ? "K" : "J"} />
								</TooltipContent>
							</Tooltip>
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:brightness-50"
									id="pass-button"
									type="button"
									onClick={pass}
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
		</>
	);
};

export const ProspectActions = dynamic(
	() => Promise.resolve(_ProspectActions),
	{ ssr: false }
);

const MatchDialog: FC<{
	userId: string;
	kind: ProspectKind;
	onClose: () => void;
}> = ({ userId, kind, onClose }) => {
	const [session] = useSession();
	const user = useUser(userId);
	if (!session || !user) return null;

	const Icon = kind === "love" ? HeartIcon : PeaceIcon;

	return (
		<DrawerOrDialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>It&apos;s a match!</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody>
					<div className="flex flex-col justify-between gap-4">
						<span>
							You and{" "}
							<InlineLink data-sentry-block href={urls.profile(user)}>
								{displayName(user)}
							</InlineLink>{" "}
							liked each other!
						</span>
						<div className="flex items-center justify-center gap-4">
							<UserAvatar
								className="size-32 rounded-3xl"
								height={256}
								user={session.user}
								width={256}
							/>
							<div className="motion-duration-2000 hover:motion-preset-confetti">
								<Icon className="size-12 shrink-0" />
							</div>
							<UserAvatar
								className="size-32 rounded-3xl"
								height={256}
								user={user}
								width={256}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<ButtonLink href={urls.subscription.default} size="sm">
								Send a message
							</ButtonLink>
							<Button kind="tertiary" size="sm" onClick={onClose}>
								Continue browsing
							</Button>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
