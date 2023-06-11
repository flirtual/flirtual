"use client";

import { PencilIcon, ShareIcon } from "@heroicons/react/24/solid";

import { Button, ButtonLink } from "../button";

import { User } from "~/api/user";
import { toAbsoluteUrl, urls } from "~/urls";
import { useToast } from "~/hooks/use-toast";

export const PersonalActions: React.FC<{ user: User }> = ({ user }) => {
	const toasts = useToast();

	return (
		<div className="flex gap-4">
			<ButtonLink
				className="w-1/2"
				href={urls.settings.bio}
				Icon={PencilIcon}
				size="sm"
			>
				Edit profile
			</ButtonLink>
			<Button
				className="w-1/2"
				Icon={ShareIcon}
				size="sm"
				onClick={async () => {
					const link = toAbsoluteUrl(
						urls.user.profile(user.username)
					).toString();

					await navigator.clipboard.writeText(link);
					toasts.add({ type: "success", label: "Copied link!" });

					await navigator.share({
						text: "Check out my Flirtual profile!",
						url: link
					});
				}}
			>
				Share profile
			</Button>
		</div>
	);
};
