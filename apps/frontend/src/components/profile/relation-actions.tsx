"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

import { Matchmaking } from "~/api/matchmaking";
import { displayName } from "~/api/user";
import { useCurrentUser } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useRelationship, useUser } from "~/hooks/use-user";
import { relationshipKey } from "~/swr";
import { urls } from "~/urls";

import { Button, ButtonLink } from "../button";

export const RelationActions: React.FC<{ userId: string; direct: boolean }> = ({
	userId,
	direct
}) => {
	const user = useUser(userId);
	const relationship = useRelationship(userId);
	const current = useCurrentUser();

	const t = useTranslations("profile");
	const toasts = useToast();
	const router = useRouter();

	if (!user || !relationship) return null;

	if (relationship.matched)
		return (
			<div className="flex gap-4">
				<ButtonLink
					className="w-full shrink text-theme-overlay"
					href={urls.conversations.of(relationship.conversationId)}
					size="sm"
				>
					{t("every_sleek_llama_feast")}
				</ButtonLink>
				<Button
					className="w-fit"
					kind="secondary"
					size="sm"
					type="button"
					onClick={async () => {
						await Matchmaking.unmatch(user.id).catch(toasts.addError);
						mutate(relationshipKey(user.id));

						toasts.add(
							t("weird_green_crab_peek", {
								displayName: displayName(user)
							})
						);
						router.refresh();
					}}
				>
					{t("neat_moving_ibex_nail")}
				</Button>
			</div>
		);

	if (direct && relationship.type && relationship.kind)
		return (
			<div className="flex w-full items-center justify-between gap-4 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<span className="text-xl text-theme-overlay [overflow-wrap:anywhere]">
					{t(`relationship_status.to_other`, {
						status:
							relationship.type === "like"
								? relationship.kind === "love"
									? "liked"
									: "homied"
								: "passed",
						displayName: displayName(user)
					})}
				</span>
				<Button
					className="shrink-0"
					kind="secondary"
					size="sm"
					onClick={async () => {
						await Matchmaking.unmatch(user.id).catch(toasts.addError);
						mutate(relationshipKey(user.id));

						router.refresh();
					}}
				>
					Undo
				</Button>
			</div>
		);

	if (relationship.likedMe && current?.subscription?.active)
		return (
			<div className="flex items-center gap-3 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<Sparkles className="size-6 shrink-0 text-theme-overlay" />
				<span className="text-xl text-theme-overlay [overflow-wrap:anywhere]">
					{t(`relationship_status.to_me`, {
						status: relationship.likedMe === "love" ? "liked" : "homied",
						displayName: displayName(user)
					})}
				</span>
			</div>
		);

	return null;
};
