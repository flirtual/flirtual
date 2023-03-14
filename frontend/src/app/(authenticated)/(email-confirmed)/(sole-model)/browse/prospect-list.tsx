"use client";
import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Dispatch, SetStateAction, useCallback, useState } from "react";

import { api } from "~/api";
import { ProspectRespondType } from "~/api/matchmaking";
import { User } from "~/api/user";
import { HeartGradient } from "~/components/icons/heart-gradient";
import { PeaceGradient } from "~/components/icons/peace-gradient";
import { Profile } from "~/components/profile/profile";

import { OutOfProspects } from "./out-of-prospects";

export interface ProspectListProps {
	prospects: Array<User>;
}

const ProspectActionBar: React.FC<{
	userId: string;
	setProspectIdx: Dispatch<SetStateAction<number>>;
}> = ({ userId, setProspectIdx }) => {
	const respond = useCallback(
		async (type: ProspectRespondType) => {
			await api.matchmaking.respondProspect({
				body: {
					type,
					userId
				}
			});

			setProspectIdx((prospectIdx) => prospectIdx + 1);
		},
		[userId, setProspectIdx]
	);

	return (
		<div className="h-32 w-full dark:bg-black-70 sm:h-0">
			<div className="pointer-events-none fixed left-0 bottom-0  flex  w-full items-center justify-center bg-gradient-to-b from-transparent to-black-90/50 p-8">
				<div className="pointer-events-auto flex h-32 items-center gap-3 overflow-hidden rounded-xl pb-16 text-white-10">
					<button
						className="flex h-fit items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1"
						type="button"
					>
						<ArrowUturnLeftIcon className="w-5" strokeWidth={3} />
					</button>
					<button
						className="flex items-center justify-center gap-3 rounded-xl bg-brand-gradient px-6 py-4 shadow-brand-1 sm:w-40"
						type="button"
						onClick={() => respond("like")}
					>
						<HeartGradient className="w-8 shrink-0" gradient={false} />
						<span className="hidden font-montserrat text-lg font-extrabold md:inline">Like</span>
					</button>
					<button
						className="flex items-center justify-center gap-3 rounded-xl bg-black-50 px-6 py-4 shadow-brand-1 sm:w-40"
						type="button"
					>
						<PeaceGradient className="w-8 shrink-0" gradient={false} />
						<span className="hidden font-montserrat text-lg font-extrabold md:inline">Homie</span>
					</button>
					<button
						className="flex h-fit items-center gap-3 rounded-xl bg-black-60 p-4 shadow-brand-1"
						type="button"
						onClick={() => respond("pass")}
					>
						<XMarkIcon className="w-5" strokeWidth={3} />
					</button>
				</div>
			</div>
		</div>
	);
};

export const ProspectList: React.FC<ProspectListProps> = ({ prospects }) => {
	const [prospectIdx, setProspectIdx] = useState(0);
	const prospect = prospects[prospectIdx];

	return prospect ? (
		<>
			<Profile key={prospect.id} user={prospect} />
			<ProspectActionBar setProspectIdx={setProspectIdx} userId={prospect.id} />
		</>
	) : (
		<OutOfProspects />
	);
};
