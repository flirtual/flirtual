import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { Tooltip } from "~/components/tooltip";
import { WarnProfileModal } from "~/components/modals/warn-profile";

export const WarnProfile: React.FC<{ user: User }> = ({ user }) => {
	const [visible, setVisible] = useState(false);

	return (
		<WarnProfileModal
			user={user}
			visible={visible}
			onVisibilityChange={setVisible}
		>
			<Tooltip fragmentClassName="h-6 w-6" value="Warn profile">
				<button
					className="h-full w-full"
					type="button"
					onClick={() => setVisible(true)}
				>
					<ExclamationTriangleIcon className="h-full w-full" />
				</button>
			</Tooltip>
		</WarnProfileModal>
	);
};
