"use client";

import { ButtonLink } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { FaceTimeIcon } from "~/components/icons";
import { useSession } from "~/hooks/use-session";

import type { User } from "~/api/user";
import type { FC } from "react";

export interface FaceTimeButtonProps {
	user: User;
}

export const FaceTimeButton: FC<FaceTimeButtonProps> = (props) => {
	const { user } = props;
	const { platform, vision } = useDevice();
	const [session] = useSession();

	if (
		!vision ||
		!session?.user.tags?.includes("debugger") ||
		!session.user.profile.facetime ||
		!user.profile.facetime
	)
		return null;

	return (
		<>
			{platform === "apple" && (
				<ButtonLink
					className="ml-auto bg-[#0ebe2c]"
					href={`facetime://${user.profile.facetime}`}
					Icon={FaceTimeIcon}
					size="sm"
				>
					FaceTime
				</ButtonLink>
			)}
		</>
	);
};
