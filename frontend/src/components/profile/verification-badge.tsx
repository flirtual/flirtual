import { CheckBadgeIcon } from "@heroicons/react/24/solid";

import { Tooltip } from "../tooltip";

export const ProfileVerificationBadge: React.FC = () => (
	<Tooltip value="Age verified">
		<div className="relative h-6 w-6">
			<div className="absolute left-1/4 top-1/4 h-3 w-3 bg-white-20" />
			<CheckBadgeIcon className="absolute h-full w-full fill-theme-1" />
		</div>
	</Tooltip>
);
