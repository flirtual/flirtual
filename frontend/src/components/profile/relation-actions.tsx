"use client";

import { SparklesIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

import { User, displayName } from "~/api/user";
import { urls } from "~/urls";
import { api } from "~/api";
import { useToast } from "~/hooks/use-toast";

import { Button, ButtonLink } from "../button";
import { VRChatIcon } from "../icons/brand/vrchat";
import { InlineLink } from "../inline-link";
import { DiscordIcon } from "../icons";

export const RelationActions: React.FC<{ user: User }> = ({ user }) => {
	const { relationship } = user;

	const toasts = useToast();
	const router = useRouter();

	if (!relationship) return null;

	if (relationship.matched)
		return (
			<>
				<div className="flex gap-4">
					<ButtonLink className="w-full" href={urls.conversations.with(user.id)} size="sm">
						Message
					</ButtonLink>
					<Button
						className="w-fit"
						kind="secondary"
						size="sm"
						type="button"
						onClick={() => {
							void api.matchmaking
								.unmatch({ query: { userId: user.id } })
								.then(() => {
									toasts.add({
										type: "success",
										label: `Successfully unmatched ${displayName(user)}`
									});

									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
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

	if (relationship.type && relationship.kind)
		return (
			<div className="flex w-full items-center justify-between gap-4 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<span className="text-xl text-white-20 [overflow-wrap:anywhere]">
					{`You ${
						relationship.type === "like"
							? relationship.kind === "love"
								? "liked"
								: "homied"
							: "passed on"
					} ${displayName(user)}.`}
				</span>
				<Button
					className="shrink-0"
					kind="secondary"
					size="sm"
					onClick={() =>
						api.matchmaking
							.unmatch({ query: { userId: user.id } })
							.then(() => {
								return router.refresh();
							})
							.catch(toasts.addError)
					}
				>
					Undo
				</Button>
			</div>
		);

	if (relationship.likedMe)
		return (
			<div className="flex items-center gap-3 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<SparklesIcon className="h-6 w-6 shrink-0 text-white-20" />
				<span className="text-xl text-white-20 [overflow-wrap:anywhere]">
					{`${displayName(user)} ${relationship.likedMe === "love" ? "liked" : "homied"} you!`}
				</span>
			</div>
		);

	return null;
};
