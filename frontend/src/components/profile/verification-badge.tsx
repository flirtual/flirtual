import { CheckBadgeIcon } from "@heroicons/react/24/solid";

export const ProfileVerificationBadge: React.FC = () => (
	<div className="relative h-6 w-6">
		<div className="absolute top-1/4 left-1/4 h-3 w-3 bg-white-20" />
		<CheckBadgeIcon className="absolute h-full w-full fill-pink" />
	</div>
);
