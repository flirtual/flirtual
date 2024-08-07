"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { type User, displayName } from "~/api/user";
import { urls } from "~/urls";
import { api } from "~/api";
import { useToast } from "~/hooks/use-toast";

import { Button, ButtonLink } from "../button";

export const RelationActions: React.FC<{ user: User; direct: boolean }> = ({
	user,
	direct
}) => {
	const { relationship } = user;

	const toasts = useToast();
	const router = useRouter();

	if (!relationship) return null;

	if (relationship.matched)
		return (
			<>
				<div className="flex gap-4">
					<ButtonLink
						className="w-full shrink text-theme-overlay"
						href={urls.conversations.of(relationship.conversationId)}
						size="sm"
					>
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
									toasts.add(`Unmatched ${displayName(user)}`);
									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						Unmatch
					</Button>
				</div>
			</>
		);

	if (direct && relationship.type && relationship.kind)
		return (
			<div className="flex w-full items-center justify-between gap-4 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<span className="text-xl text-theme-overlay [overflow-wrap:anywhere]">
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
				<Sparkles className="size-6 shrink-0 text-theme-overlay" />
				<span className="text-xl text-theme-overlay [overflow-wrap:anywhere]">
					{`${displayName(user)} ${
						relationship.likedMe === "love" ? "liked" : "homied"
					} you!`}
				</span>
			</div>
		);

	return null;
};
