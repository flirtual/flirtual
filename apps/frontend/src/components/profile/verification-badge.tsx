import { CheckBadgeIcon } from "@heroicons/react/24/solid";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export const ProfileVerificationBadge: React.FC = () => (
	<Tooltip>
		<TooltipTrigger asChild>
			<div className="relative h-6 w-6">
				<div className="absolute left-1/4 top-1/4 h-3 w-3 bg-white-20" />
				<CheckBadgeIcon className="absolute h-full w-full fill-theme-2" />
			</div>
		</TooltipTrigger>
		<TooltipContent>Age verified</TooltipContent>
	</Tooltip>
);
