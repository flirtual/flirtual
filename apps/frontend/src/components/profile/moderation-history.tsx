import { ChevronDown, ChevronRight, History } from "lucide-react";
import { Suspense } from "react";
import type { FC } from "react";

import { ModerationEvent } from "~/api/moderation-event";
import { Report } from "~/api/report";
import type { ListReportOptions } from "~/api/report";
import { usePreferences } from "~/hooks/use-preferences";
import { useOptionalSession } from "~/hooks/use-session";
import { useUser } from "~/hooks/use-user";
import { useQuery } from "~/query";

import { ModerationEntryRow, toModerationEntries } from "../moderation-entry";

const ModerationHistoryList: FC<{ userId: string; revision: string }> = ({ userId, revision }) => {
	const reportOptions: ListReportOptions = { targetId: userId, reviewed: true, indefShadowbanned: true };

	const events = useQuery({
		queryKey: ["moderation-events", userId, revision],
		queryFn: () => ModerationEvent.list(userId),
		staleTime: 0
	});

	const reports = useQuery({
		queryKey: ["reports", reportOptions],
		queryFn: () => Report.list(reportOptions),
		staleTime: 0
	});

	const entries = toModerationEntries(events, reports);

	if (entries.length === 0) return <span className="text-sm">None</span>;

	return (
		<div className="flex flex-col gap-1">
			{entries.map((entry) => <ModerationEntryRow key={`${entry.kind}-${entry.id}`} entry={entry} />)}
		</div>
	);
};

export const ProfileModerationHistory: FC<{ userId: string }> = ({ userId }) => {
	const session = useOptionalSession();
	const user = useUser(userId);

	const [shown, setShown] = usePreferences(
		"profile-moderation-history-visible",
		false
	);

	if (!user || !session || !session.user?.tags?.includes("moderator")) return null;

	// Moderation actions update these, so the list refetches after one.
	const revision = [
		user.bannedAt,
		user.shadowbannedAt,
		user.indefShadowbannedAt,
		user.paymentsBannedAt,
		user.moderatorMessage
	].join();

	const ShownIcon = shown ? ChevronDown : ChevronRight;

	return (
		<div
			data-block
			className="select-children -mx-4 flex flex-col gap-4 rounded-xl bg-white-30 px-4 py-3 font-mono shadow-brand-inset vision:bg-white-30/70 dark:bg-black-90/80 dark:text-white-20"
		>
			<button className="flex items-center gap-2" type="button" onClick={() => setShown(!shown)}>
				<History className="mt-0.5 size-4 shrink-0" />
				<span className="select-none text-sm">
					Moderation History
				</span>
				<ShownIcon className="mt-0.5 size-4 shrink-0" />
			</button>
			{shown && (
				<Suspense fallback={<span className="animate-pulse text-sm">Loading…</span>}>
					<ModerationHistoryList revision={revision} userId={userId} />
				</Suspense>
			)}
		</div>
	);
};
