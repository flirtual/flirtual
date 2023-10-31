"use client";

import { Pencil } from "lucide-react";

import { User } from "~/api/user";
import { toAbsoluteUrl, urls } from "~/urls";
import { useShare } from "~/hooks/use-share";

import { Button, ButtonLink } from "../button";
import { ShareIcon } from "../icons/share";

export const PersonalActions: React.FC<{ user: User }> = ({ user }) => {
	const share = useShare();

	return (
		<div className="flex gap-4">
			<ButtonLink
				className="w-1/2 text-theme-overlay"
				href={urls.settings.bio}
				Icon={Pencil}
				size="sm"
			>
				Edit
			</ButtonLink>
			<Button
				className="w-1/2 text-theme-overlay"
				Icon={ShareIcon}
				size="sm"
				onClick={async () => {
					const url = toAbsoluteUrl(urls.profile(user)).toString();

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
