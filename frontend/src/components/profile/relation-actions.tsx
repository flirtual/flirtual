"use client";

import { SparklesIcon } from "@heroicons/react/24/solid";

import { User, displayName } from "~/api/user";
import { urls } from "~/urls";

import { Button, ButtonLink } from "../button";
import { VRChatIcon } from "../icons/brand/vrchat";
import { InlineLink } from "../inline-link";
import { DiscordIcon } from "../icons";

export const RelationActions: React.FC<{ user: User }> = ({ user }) => {
	const { relationship } = user;
	if (!relationship) return null;

	if (relationship.matched)
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

	if (relationship.type)
		return (
			<div className="flex w-full items-center justify-between gap-4">
				<span className="text-xl [overflow-wrap:anywhere] dark:text-white-20">
					{`You ${
						relationship.type === "like"
							? relationship.kind === "love"
								? "liked"
								: "homied"
							: "passed on"
					} ${displayName(user)}.`}
				</span>
				<Button className="shrink-0" size="sm" onClick={() => alert("TODO")}>
					Undo
				</Button>
			</div>
		);

	if (relationship.likedMe)
		return (
			<div className="flex items-center gap-3">
				<SparklesIcon className="h-6 w-6 shrink-0" />
				<span className="text-xl [overflow-wrap:anywhere] dark:text-white-20">
					{`${displayName(user)} ${relationship.likedMe === "love" ? "liked" : "homied"} you!`}
				</span>
			</div>
		);

	return null;
};
