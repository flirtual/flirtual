import { Suspense } from "react";
import type { FC } from "react";

import { ModerationEvent } from "~/api/moderation-event";
import { Report } from "~/api/report";
import type { ListReportOptions } from "~/api/report";
import type { User } from "~/api/user";
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

export const ProfileModerationHistory: FC<{ user: User }> = ({ user }) => {
	// Moderation actions update these, so the list refetches after one.
	const revision = [
		user.bannedAt,
		user.shadowbannedAt,
		user.indefShadowbannedAt,
		user.paymentsBannedAt,
		user.moderatorMessage
	].join();

	return (
		<div className="flex flex-col gap-1">
			<span className="font-bold">Moderation History:</span>
			<Suspense fallback={<span className="animate-pulse text-sm">Loading…</span>}>
				<ModerationHistoryList revision={revision} userId={user.id} />
			</Suspense>
		</div>
	);
};
