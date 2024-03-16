"use client";

import { FC } from "react";

import { ButtonLink } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { User } from "~/api/user";
import { FaceTimeIcon } from "~/components/icons";
import { useSession } from "~/hooks/use-session";

export interface FaceTimeButtonProps {
	user: User;
}

export const FaceTimeButton: FC<FaceTimeButtonProps> = (props) => {
	const { user } = props;
	const { platform } = useDevice();
	const [session] = useSession();

	if (!session?.user.tags?.includes("debugger")) return null;

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
