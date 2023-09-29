"use client";

import { ProspectKind, ProspectRespondType, RespondProspectBody } from "~/api/matchmaking";
import { User } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { withSession } from "~/server-utilities";

import { DebuggerActions } from "./debugger-actions";
import { OutOfProspects } from "./out-of-prospects";
import { useSession } from "~/hooks/use-session";
import { FC, useCallback, useState } from "react";
import { ResponseChangesetError, api } from "~/api";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { twMerge } from "tailwind-merge";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { AnimatePresence, useAnimate, usePresence } from "framer-motion"
import { ProspectActions } from "./prospect-actions";

export interface ProspectListProps {
	prospects: Array<User>;
	kind: ProspectKind;
}

export const ProspectList: FC<ProspectListProps> =  ({ kind, prospects })=> {
	const [session] = useSession();
	
	if (!session) return null;

	const prospect = prospects[0];
	const nextProspect = prospects[1];

	return (
		<>
			{prospect ? (
				<>
					{prospects.length}
					<div className="relative flex gap-4" >
						{prospects.map((prospect) => <div key={prospect.id}>
							<span>{prospect.id}</span>
							<Profile user={prospect} />
						</div>)}
					</div>
					<ProspectActions prospect={prospect} kind={kind}/>
				</>
			) : (<OutOfProspects mode={kind} user={session.user} />
				
			)}
			<DebuggerActions session={session} />
		</>
	);
}
