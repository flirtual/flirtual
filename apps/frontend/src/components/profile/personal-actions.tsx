"use client";

import { PencilIcon, ShareIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { toAbsoluteUrl, urls } from "~/urls";
import { useShare } from "~/hooks/use-share";

import { Button, ButtonLink } from "../button";

export const PersonalActions: React.FC<{ user: User }> = ({ user }) => {
	const share = useShare();

	return (
		<div className="flex gap-4">
			<ButtonLink
				className="w-1/2"
				href={urls.settings.bio}
				Icon={PencilIcon}
				size="sm"
			>
				Edit
			</ButtonLink>
			<Button
				className="w-1/2"
				Icon={ShareIcon}
				size="sm"
				onClick={async () => {
					const url = toAbsoluteUrl(
						urls.user.profile(user.username)
					).toString();

					await share({
						text: "Check out my Flirtual profile!",
						url
					});
				}}
			>
				Share
			</Button>
		</div>
	);
};
