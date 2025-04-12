"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Matchmaking } from "~/api/matchmaking";
import { displayName } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useRelationship, useUser } from "~/hooks/use-user";
import { useRouter } from "~/i18n/navigation";
import { mutate, relationshipKey } from "~/swr";
import { urls } from "~/urls";

import { Button, ButtonLink } from "../button";

export const RelationActions: React.FC<{ userId: string; direct: boolean }> = ({
	userId,
	direct
}) => {
	const user = useUser(userId);
	const relationship = useRelationship(userId);
	const { user: current } = useSession();

	const t = useTranslations();
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
					{t("message")}
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
							t("unmatched_name", {
								name: displayName(user)
							})
						);
						router.refresh();
					}}
				>
					{t("unmatch")}
				</Button>
			</div>
		);

	if (direct && relationship.type && relationship.kind)
		return (
			<div className="flex w-full items-center justify-between gap-4 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<span className="text-xl text-theme-overlay [overflow-wrap:anywhere]">
					{t(`pipe_land_teeny_hypnotic`, {
						status:
							relationship.type === "like"
								? relationship.kind === "love"
									? "liked"
									: "homied"
								: "passed",
						name: displayName(user)
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
					{t(`mint_colossal_kettle_sense`, {
						status: relationship.likedMe === "love" ? "liked" : "homied",
						name: displayName(user)
					})}
				</span>
			</div>
		);

	return null;
};
