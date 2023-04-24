"use client";

import { User } from "~/api/user";
import { urls } from "~/urls";

import { Button, ButtonLink } from "../button";
import { InlineLink } from "../inline-link";
import { DiscordIcon } from "../icons/brand/discord";
import { VRChatIcon } from "../icons/brand/vrchat";

export const MatchActions: React.FC<{ user: User }> = ({ user }) => {
	return (
		<>
			<div className="flex gap-4">
				<ButtonLink className="w-full" href={urls.conversations.with(user.id)} size="sm">
					Message
				</ButtonLink>
				<Button className="w-fit" kind="secondary" size="sm" type="button">
					Unmatch
				</Button>
			</div>
			<div className="flex flex-col gap-2">
				{user.profile.vrchat && (
					<div className="flex items-center gap-2">
						<div className="w-6">
							<VRChatIcon className="h-6" />
						</div>
						VRChat:{" "}
						<InlineLink className="w-full" href={urls.vrchat(user.profile.vrchat)}>
							{user.profile.vrchat}
						</InlineLink>
					</div>
				)}
				{user.profile.discord && (
					<div className="flex items-center gap-2">
						<DiscordIcon className="h-6 w-6" />
						Discord: <span>{user.profile.discord}</span>
					</div>
				)}
			</div>
		</>
	);
};
