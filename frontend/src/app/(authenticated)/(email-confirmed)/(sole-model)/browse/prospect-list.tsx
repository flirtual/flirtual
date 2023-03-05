"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";

import { api } from "~/api";
import { ProspectRespondType } from "~/api/matchmaking";
import { User } from "~/api/user";
import { HeartGradient } from "~/components/icons/heart-gradient";
import { Profile } from "~/components/profile/profile";

export interface ProspectListProps {
	prospects: Array<User>;
}

export const ProspectList: React.FC<ProspectListProps> = ({ prospects }) => {
	const [prospectIdx, setProspectIdx] = useState(0);
	const prospect = prospects[prospectIdx];

	const respond = useCallback(
		async (type: ProspectRespondType) => {
			if (!prospect.id) return;

			await api.matchmaking.respondProspect({
				body: {
					type,
					userId: prospect.id
				}
			});

			setProspectIdx(prospectIdx + 1);
		},
		[prospectIdx, prospect?.id]
	);

	if (!prospect) return null;

	return (
		<>
			<Profile user={prospect} />
			<div className="h-32 w-full dark:bg-black-70 sm:h-0">
				<div className="pointer-events-none fixed left-0 bottom-16 flex h-32 w-full items-center justify-center p-8">
					<div className="pointer-events-auto flex h-fit overflow-hidden rounded-xl text-white-10 shadow-brand-1">
						<button
							className="flex items-center gap-3 bg-brand-gradient px-8 py-4"
							type="button"
							onClick={() => respond("like")}
						>
							<HeartGradient className="w-8" gradient={false} />
							<span className="font-montserrat text-lg font-extrabold">Like</span>
						</button>
						<button
							className="flex items-center gap-3 bg-black-50 px-8 py-4"
							type="button"
							onClick={() => respond("pass")}
						>
							<XMarkIcon className="w-8" strokeWidth={3} />
							<span className="font-montserrat text-lg font-extrabold">Pass</span>
						</button>
					</div>
				</div>
			</div>
		</>
	);
};
