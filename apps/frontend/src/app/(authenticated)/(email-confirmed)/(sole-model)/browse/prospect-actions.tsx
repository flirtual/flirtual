"use client";

import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { ResponseChangesetError, api } from "~/api";
import {
	ProspectKind,
	ProspectRespondType,
	RespondProspectBody
} from "~/api/matchmaking";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Tooltip } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { useTour } from "~/hooks/use-tour";

export interface ProspectActionBarProps {
	userId: string;
	mode: ProspectKind;
}

export const ProspectActionBar: FC<ProspectActionBarProps> = ({
	userId,
	mode
}) => {
	const toasts = useToast();
	const router = useRouter();

	const [lastProfile, setLastProfile] = useState<RespondProspectBody | null>(
		null
	);

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
					With ❤️, the Flirtual team`,
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

	const respond = useCallback(
		async (type: ProspectRespondType, kind: ProspectKind) => {
			const body = {
				type,
				kind,
				mode: mode === kind ? undefined : mode,
				userId
			};

			await api.matchmaking
				.respondProspect({ body })
				.then(() => {
					setLastProfile(body);
					return router.refresh();
				})
				.catch((reason) => {
					if (
						!(reason instanceof ResponseChangesetError) &&
						!Object.keys(reason.properties).includes("userId")
					)
						toasts.addError(reason);
					else router.refresh();
				});
		},
		[userId, mode, router, toasts]
	);

	const respondReverse = useCallback(async () => {
		if (!lastProfile) return;
		const { userId, kind } = lastProfile;

		void api.matchmaking
			.reverseRespondProspect({
				body: { userId, kind }
			})
			.then(() => router.refresh())
			.catch(toasts.addError);

		setLastProfile(null);
	}, [router, lastProfile, toasts.addError]);

	return (
		<div className="h-32 w-full dark:bg-black-70 sm:h-0">
			<div className="pointer-events-none fixed bottom-0 left-0 flex w-full items-center justify-center bg-gradient-to-b from-transparent to-black-90/50 p-8">
				<div className="pointer-events-auto flex h-32 items-center gap-3 overflow-hidden rounded-xl pb-16 text-white-10">
					<Tooltip value="Undo previous">
						<button
							className="flex h-fit items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1 disabled:cursor-not-allowed disabled:brightness-50"
							disabled={!lastProfile}
							id="undo-button"
							type="button"
							onClick={respondReverse}
						>
							<ArrowUturnLeftIcon className="w-5" strokeWidth={3} />
						</button>
					</Tooltip>
					{mode === "love" && (
						<Tooltip value="Like profile">
							<button
								className="flex items-center justify-center gap-3 rounded-xl bg-brand-gradient px-6 py-4 shadow-brand-1 sm:w-40"
								id="like-button"
								type="button"
								onClick={() => respond("like", mode)}
							>
								<HeartIcon className="w-8 shrink-0" gradient={false} />
								<span className="hidden font-montserrat text-lg font-extrabold md:inline">
									Like
								</span>
							</button>
						</Tooltip>
					)}
					<Tooltip value="Friend profile">
						<button
							id="friend-button"
							type="button"
							className={twMerge(
								"flex items-center justify-center gap-3 rounded-xl bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 px-6 py-4 shadow-brand-1",
								mode === "friend" && "w-40"
							)}
							onClick={() => respond("like", "friend")}
						>
							<PeaceIcon className="w-8 shrink-0" gradient={false} />
							<span className="hidden font-montserrat text-lg font-extrabold md:inline">
								Homie
							</span>
						</button>
					</Tooltip>
					<Tooltip value="Pass profile">
						<button
							className="flex h-fit items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1"
							id="pass-button"
							type="button"
							onClick={() => respond("pass", mode)}
						>
							<XMarkIcon className="w-5" strokeWidth={3} />
						</button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
};
