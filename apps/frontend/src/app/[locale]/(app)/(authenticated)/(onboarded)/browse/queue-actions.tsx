"use client";

import { InAppReview } from "@capacitor-community/in-app-review";
import { Undo2, X } from "lucide-react";
import ms from "ms";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRouter } from "~/i18n/navigation";
import {
	type FC,
	Suspense,
	useCallback,
	useEffect
} from "react";
import { type Key, mutate } from "~/query";
import useMutation from "swr/mutation";
import { match, P } from "ts-pattern";

import type { WretchIssue } from "~/api/common";
import {
	Matchmaking,
	type ProspectKind,
	type ProspectRespondType,
	type Queue,
	type QueueActionIssue,
	type RespondProspect
} from "~/api/matchmaking";
import { displayName, User } from "~/api/user";
import { Button, ButtonLink } from "~/components/button";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { UserAvatar } from "~/components/user-avatar";
import { useDevice } from "~/hooks/use-device";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useOptionalSession } from "~/hooks/use-session";
import { useDefaultTour } from "~/hooks/use-tour";
import { useUser } from "~/hooks/use-user";
import { queueKey, relationshipKey } from "~/query";
import { urls } from "~/urls";
import { newConversationId } from "~/utilities";

import { Countdown } from "./countdown";
import type { QueueAnimationDirection } from "./queue";

function Key({ label }: { label: string }) {
	return (
		<kbd className="mb-0.5 inline-block size-7 rounded-md bg-white-20 pt-0.5 text-center font-nunito font-bold text-black-60 shadow-[0_1px_1px_2px_rgba(255,255,255,0.75)] dark:bg-black-60 dark:text-white-20 dark:shadow-[0_1px_1px_2px_rgba(0,0,0,0.65)]">
			{label}
		</kbd>
	);
}

function DefaultTour() {
	const session = useOptionalSession();
	const { vision } = useDevice();
	useDefaultTour(!session?.user.moderatorMessage && !vision);

	return null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function optimisticQueueMove(direction: QueueAnimationDirection) {
	return (value?: Queue): Queue => {
		window.scrollTo({ top: 0, behavior: "smooth" });

		if (!value) return [null, null, null];

		return direction === "backward"
			? value[0] ? [null, value[0], value[1]] : value
			: value[2] ? [value[1], value[2], null] : value;
	};
}

const QueueActions_: FC<{
	queue?: Queue;
	explicitUserId?: string;
	kind: ProspectKind;
}> = ({ queue, explicitUserId, kind: mode }) => {
	const session = useOptionalSession();
	const { native } = useDevice();
	const t = useTranslations();

	useEffect(() => {
		if (!session?.user.createdAt || !native) return;

		const ratingPrompts = session.user.ratingPrompts;
		const monthsRegistered = Math.floor(
			(Date.now() - new Date(session.user.createdAt).getTime()) / ms("30d")
		);

		if (
			(monthsRegistered >= 1 && ratingPrompts === 0)
			|| (monthsRegistered >= 3 && ratingPrompts === 1)
			|| (monthsRegistered >= 6 && ratingPrompts === 2)
		) {
			void InAppReview.requestReview();
			void User.updateRatingPrompts(session.user.id, {
				ratingPrompts: monthsRegistered >= 6 ? 3 : monthsRegistered >= 3 ? 2 : 1
			});
		}
	}, [native, session]);

	const { trigger, reset, data, error } = useMutation<
		RespondProspect | undefined,
		WretchIssue<QueueActionIssue>,
		ReturnType<typeof queueKey>,
		{
			type: "undo" | ProspectRespondType;
			kind: ProspectKind;
			userId?: string;
		},
		Queue | undefined
	>(
		queueKey(mode),
		async (_, { arg: { type, kind, userId } }) => {
			if (type === "undo") {
				return Matchmaking.undo({
					mode
				});
			}

			return Matchmaking.queueAction({
				userId,
				kind,
				mode,
				type,
			});
		},
		{
			throwOnError: false,
			revalidate: false,
			populateCache: (value) => {
				if (value && "queue" in value) return value.queue;
			},
			onSuccess: (data) => {
				if (data?.userId)
					mutate(relationshipKey(data?.userId));

				if (Array.isArray(data?.queue))
					data.queue.filter(Boolean).map((userId) => mutate(relationshipKey(userId)));
			}
		}
	);

	const like = useCallback((kind: ProspectKind = "love") =>
		trigger(
			{ type: "like", kind, userId: explicitUserId },
			{ optimisticData: optimisticQueueMove("forward") }
		), [trigger, explicitUserId]);

	const pass = useCallback(() =>
		trigger(
			{ type: "pass", kind: mode, userId: explicitUserId },
			{ optimisticData: optimisticQueueMove("forward") }
		), [trigger, mode, explicitUserId]);

	const undo = useCallback(() =>
		trigger(
			{ type: "undo", kind: mode },
			{ optimisticData: optimisticQueueMove("backward") }
		), [trigger, mode]);

	useGlobalEventListener(
		"document",
		"keydown",
		useCallback(
			(event) => {
				if (document.querySelector("[data-radix-focus-guard]") || event.ctrlKey || event.metaKey)
					return;

				if (event.key === "h") void undo();
				if (event.key === "j") void like();
				if (event.key === "k") void like("friend");
				if (event.key === "l") void pass();
				event.preventDefault();
			},
			[like, pass, undo]
		)
	);

	return (
		<Suspense>
			<DefaultTour />
			{match({ data, error })
				.with({ data: { match: true } }, ({ data: { matchKind, userId } }) => (
					<MatchDialog kind={matchKind} userId={userId} onClose={reset} />
				))
				.with(
					{
						error: {
							json: {
								error: P.union("out_of_likes", "out_of_passes")
							}
						}
					},
					({
						error: {
							json: {
								details: { reset_at }
							}
						}
					}) => (
						<DrawerOrDialog
							open
							onOpenChange={(open) => {
								if (!open) reset();
							}}
						>
							<>
								<DialogHeader>
									<DialogTitle>{t("warm_ago_slug_leap")}</DialogTitle>
									<DialogDescription className="sr-only" />
								</DialogHeader>
								<DialogBody>
									<div className="flex flex-col justify-between gap-4 px-2 desktop:max-w-sm">
										<div className="flex flex-col gap-4">
											<div className="flex max-w-md flex-col gap-4 font-nunito">
												<p>
													{t.rich("cozy_such_jannes_laugh", {
														link: (children) => (
															<InlineLink href={urls.subscription.default}>
																{children}
															</InlineLink>
														),
														strong: (children) => <strong>{children}</strong>
													})}
												</p>
												{mode === "love" && (
													<p>
														{t.rich("small_drab_rooster_drum", {
															link: (children) => (
																<InlineLink href={urls.browse("friend")}>
																	{children}
																</InlineLink>
															)
														})}
													</p>
												)}
												<p className="font-semibold">{t("tense_loose_felix_beam")}</p>
												<Countdown date={reset_at} onComplete={reset} />
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<ButtonLink href={urls.subscription.default} size="sm">
												{t("get_premium")}
											</ButtonLink>
											<ButtonLink
												href={
													mode === "love"
														? urls.browse("friend")
														: urls.browse()
												}
												kind="tertiary"
												size="sm"
											>
												{t(mode === "love" ? "homie_mode" : "leave_homie_mode")}
											</ButtonLink>
										</div>
									</div>
								</DialogBody>
							</>
						</DrawerOrDialog>
					)
				)
				.otherwise(() => null)}
			{(Array.isArray(queue) || explicitUserId) && (
				<div className="h-[5.5rem] w-full desktop:h-0">
					<div className="pointer-events-none fixed bottom-[max(calc(var(--safe-area-inset-bottom,0rem)+3.375rem),4.5rem)] left-0 z-20 flex w-full flex-col items-center justify-center gap-3 px-2 pb-4 vision:bottom-2 desktop:bottom-0 desktop:py-8">
						<div className="pointer-events-auto flex items-center gap-1.5 overflow-hidden rounded-xl py-2 text-white-10 desktop:gap-3">
							{!explicitUserId && (
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:brightness-50"
											disabled={!Array.isArray(queue) || !queue[0]}
											id="undo-button"
											type="button"
											onClick={undo}
										>
											<Undo2 className="size-7" strokeWidth={3} />
										</button>
									</TooltipTrigger>
									<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
										<span className="pt-1">{t("undo")}</span>
										<Key label="H" />
									</TooltipContent>
								</Tooltip>
							)}
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
											<span className="pt-1">{t("like")}</span>
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
										<span className="pt-1">{t("homie")}</span>
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
									<span className="pt-1">{t("pass")}</span>
									<Key label="L" />
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>
			)}
		</Suspense>
	);
};

export const QueueActions = dynamic(() => Promise.resolve(QueueActions_), {
	ssr: false,
	loading: () => null
});

const MatchDialog: FC<{
	userId: string;
	kind: ProspectKind;
	onClose: () => void;
}> = ({ userId, kind, onClose }) => {
	const router = useRouter();
	const session = useOptionalSession();
	const user = useUser(userId);
	const t = useTranslations();

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
					<DialogTitle>{t("its_a_match")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody>
					<div className="flex flex-col justify-between gap-4">
						<span>
							{t.rich("green_aqua_ibex_value", {
								name: () => <InlineLink data-block href={urls.profile(user)}>{displayName(user)}</InlineLink>
							})}
						</span>
						<div className="flex items-center justify-center gap-4">
							<UserAvatar
								className="size-32 rounded-3xl"
								height={256}
								user={session.user}
								width={256}
							/>
							<Icon className="size-12 shrink-0" />
							<UserAvatar
								className="size-32 rounded-3xl"
								height={256}
								user={user}
								width={256}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Button
								size="sm"
								onClick={async () =>
									router.push(
										urls.conversations.of(
											await newConversationId(session.user.id, user.id)
										)
									)}
							>
								{t("send_a_message")}
							</Button>
							<Button kind="tertiary" size="sm" onClick={onClose}>
								{t("continue_browsing")}
							</Button>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
