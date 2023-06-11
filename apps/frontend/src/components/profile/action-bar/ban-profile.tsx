import { useState } from "react";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { BanProfileModal } from "~/components/modals/ban-profile";
import { Tooltip } from "~/components/tooltip";

export const BanProfile: React.FC<{ user: User }> = ({ user }) => {
	const [visible, setVisible] = useState(false);

	return (
		<BanProfileModal
			user={user}
			visible={visible}
			onVisibilityChange={setVisible}
		>
			<Tooltip fragmentClassName="h-6 w-6" value="Ban profile">
				<button
					className="h-full w-full"
					type="button"
					onClick={() => setVisible(true)}
				>
					<ShieldExclamationIcon className="h-full w-full" />
				</button>
			</Tooltip>
		</BanProfileModal>
	);
};
