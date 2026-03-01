import { useTranslation } from "react-i18next";

import { Matchmaking } from "~/api/matchmaking";
import { invalidateMatch, invalidateQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useRelationship, useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

import { Button, ButtonLink } from "../button";
import { HeartIcon } from "../icons/gradient/heart";
import { PeaceIcon } from "../icons/gradient/peace";

export const RelationActions: React.FC<{ userId: string; direct: boolean }> = ({
	userId,
	direct
}) => {
	const user = useUser(userId);
	const relationship = useRelationship(userId);
	const { user: current } = useSession();

	const { t } = useTranslation();
	const toasts = useToast();

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
						await Matchmaking.unmatch(user.id)
							.then(() => toasts.add(t("unmatched_name", { name: user.profile.displayName || t("unnamed_user") })))
							.catch(toasts.addError);

						await Promise.all([
							invalidateMatch(user.id),
							invalidateQueue("love"),
							invalidateQueue("friend")
						]);
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
						name: user.profile.displayName || t("unnamed_user")
					})}
				</span>
				<Button
					className="shrink-0"
					kind="secondary"
					size="sm"
					onClick={async () => {
						await Matchmaking.unmatch(user.id).catch(toasts.addError);
						await Promise.all([
							invalidateMatch(user.id),
							invalidateQueue("love"),
							invalidateQueue("friend")
						]);
					}}
				>
					{t("undo")}
				</Button>
			</div>
		);

	if (relationship.likedMe && current?.subscription?.active) {
		const Icon = relationship.likedMe === "love" ? HeartIcon : PeaceIcon;

		return (
			<div className="flex items-center gap-2.5 rounded-xl bg-brand-gradient px-4 py-2 shadow-brand-1">
				<Icon className="size-6 shrink-0 text-theme-overlay" gradient={false} />
				<span className="text-xl text-theme-overlay [overflow-wrap:anywhere]">
					{t(`mint_colossal_kettle_sense`, {
						status: relationship.likedMe === "love" ? "liked" : "homied",
						name: user.profile.displayName || t("unnamed_user")
					})}
				</span>
			</div>
		);
	}

	return null;
};
