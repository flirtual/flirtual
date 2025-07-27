import type { FC } from "react";

import type { User } from "~/api/user";
import { ButtonLink } from "~/components/button";
import { FaceTimeIcon } from "~/components/icons";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

export interface FaceTimeButtonProps {
	user: User;
}

export const FaceTimeButton: FC<FaceTimeButtonProps> = (props) => {
	const { user } = props;
	const { apple, vision } = useDevice();
	const session = useOptionalSession();

	if (
		!apple
		|| !vision
		|| !session?.user.tags?.includes("debugger")
		|| !session.user.profile.facetime
		|| !user.profile.facetime
	)
		return null;

	return (
		<ButtonLink
			className="bg-[#0ebe2c]"
			href={`facetime://${user.profile.facetime}`}
			Icon={FaceTimeIcon}
			size="sm"
		>
			FaceTime
		</ButtonLink>
	);
};
