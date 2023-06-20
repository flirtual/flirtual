import { FC } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { Tooltip } from "~/components/tooltip";
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
			<Tooltip fragmentClassName="h-6 w-6" value="Warn profile">
				<button
					className="h-full w-full"
					type="button"
					onClick={() => onVisibilityChange(true)}
				>
					<ExclamationTriangleIcon className="h-full w-full" />
				</button>
			</Tooltip>
		</WarnProfileModal>
	);
};
