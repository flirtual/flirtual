import {
	ClipboardDocumentIcon,
	EllipsisHorizontalIcon,
	EyeIcon,
	FlagIcon
} from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { useCurrentUser } from "~/hooks/use-current-user";

export const ProfileActionBar: React.FC<{ user: User }> = ({ user }) => {
	const { data: authUser } = useCurrentUser();
	const myProfile = authUser?.id === user.id;

	return (
		<div className="flex w-full justify-between gap-3 bg-brand-gradient px-8 py-4">
			<div className="flex gap-3">
				<button type="button" onClick={() => navigator.clipboard.writeText(user.id)}>
					<ClipboardDocumentIcon className="h-6 w-6" />
				</button>
			</div>
			<div className="flex gap-3">
				<button type="button" onClick={() => navigator.clipboard.writeText(user.id)}>
					<EyeIcon className="h-6 w-6" />
				</button>
				
				<button type="button" onClick={() => navigator.clipboard.writeText(user.id)}>
					<EllipsisHorizontalIcon className="h-6 w-6" />
				</button>
			</div>
		</div>
	);
};
