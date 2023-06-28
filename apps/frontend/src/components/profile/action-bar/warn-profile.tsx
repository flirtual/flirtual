import { FC } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { WarnProfileModal } from "~/components/modals/warn-profile";

export interface WarnProfileProps {
	user: User;
	visible: boolean;
	onVisibilityChange: (visible: boolean) => void;
}

export const WarnProfile: FC<WarnProfileProps> = ({
	user,
	visible,
	onVisibilityChange
}) => {
	return (
		<WarnProfileModal
			user={user}
			visible={visible}
			onVisibilityChange={onVisibilityChange}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<button type="button" onClick={() => onVisibilityChange(true)}>
						<ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
					</button>
				</TooltipTrigger>
				<TooltipContent>Warn profile</TooltipContent>
			</Tooltip>
		</WarnProfileModal>
	);
};
