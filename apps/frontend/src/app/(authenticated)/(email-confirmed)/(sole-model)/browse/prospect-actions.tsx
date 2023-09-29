"use client"

import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ResponseChangesetError, api } from "~/api";
import { ProspectKind, ProspectRespondType, RespondProspectBody } from "~/api/matchmaking";
import { User } from "~/api/user";
import { HeartIcon } from "~/components/icons/gradient/heart"
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip"
import { useToast } from "~/hooks/use-toast";

export const ProspectActions: FC<{prospect: User, kind: ProspectKind}> = ({prospect, kind}) => {
	const toasts = useToast();
	const router = useRouter();

	const [lastProfile, setLastProfile] = useState<RespondProspectBody | null>(
		null
	);

	const respond = useCallback(
		async (type: ProspectRespondType, _kind: ProspectKind) => {
			const body = {
				type,
				kind: _kind,
				mode: kind === _kind ? undefined : kind,
				userId: prospect.id
			};

			window.scrollTo({ top: 0, behavior: "smooth" });

			/* const animation = animate([
				["#current-profile", { opacity: 0 }, {duration: 0.5, }],
				["#next-profile", { opacity: 1, display: "flex" }, {duration: 1}],
			], {}); */

			await api.matchmaking.respondProspect({ body }).catch((reason) => {
				if (
					!(reason instanceof ResponseChangesetError) &&
					reason &&
					!Object.keys(reason.properties).includes("userId")
				)
					toasts.addError(reason);
				else router.refresh();
			})

			setLastProfile(body);

			// await animation;

			router.refresh();
		},
		[prospect, kind, router, toasts]
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
						<TooltipTrigger asChild>
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
									className="flex max-w-[20vw] items-center justify-center gap-3 rounded-xl bg-brand-gradient px-6 py-4 shadow-brand-1 sm:w-40"
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
									"flex max-w-[20vw] items-center justify-center gap-3 rounded-xl bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 px-6 py-4 shadow-brand-1",
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
								className="flex h-fit max-w-[15vw] items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1"
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
	)
}