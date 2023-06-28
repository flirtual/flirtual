import { useState } from "react";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { BanProfileModal } from "~/components/modals/ban-profile";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";

export const BanProfile: React.FC<{ user: User }> = ({ user }) => {
	const [visible, setVisible] = useState(false);

	return (
		<BanProfileModal
			user={user}
			visible={visible}
			onVisibilityChange={setVisible}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<button type="button" onClick={() => setVisible(true)}>
						<ShieldExclamationIcon className="h-6 w-6 text-red-500" />
					</button>
				</TooltipTrigger>
				<TooltipContent>Ban profile</TooltipContent>
			</Tooltip>
		</BanProfileModal>
	);
};
