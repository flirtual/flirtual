import { CheckBadgeIcon } from "@heroicons/react/24/solid";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export interface ProfileVerificationBadgeProps {
	tooltip: string;
}

export const ProfileVerificationBadge: React.FC<
	ProfileVerificationBadgeProps
> = (props) => {
	const { tooltip } = props;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="relative h-6 w-6">
					<div className="absolute left-1/4 top-1/4 h-3 w-3 bg-theme-overlay" />
					<CheckBadgeIcon className="absolute h-full w-full fill-theme-2" />
				</div>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
};
