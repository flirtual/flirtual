import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { m } from "motion/react";
import type { FC } from "react";
import { Suspense, useDeferredValue, useLayoutEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router";
import { twMerge } from "tailwind-merge";

import { attributeId } from "~/api/attributes";
import {
	ModerationEvent
} from "~/api/moderation-event";
import type { ModerationEventType } from "~/api/moderation-event";
import { Report } from "~/api/report";
import { InputCheckbox, InputLabel, InputSwitch, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { ModerationEntryCard, toModerationEntries } from "~/components/moderation-entry";
import type { ModerationEntry } from "~/components/moderation-entry";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate } from "~/query";
import type { ModerationQueueTab } from "~/urls";

import { ReportsTab, UserDisplayName } from "./reports";

type Category = Exclude<ModerationQueueTab, "all" | "reports">;

const categories: Record<Category, {
	label: string;
	types: Array<ModerationEventType>;
	reviewable: boolean;
	adminOnly?: boolean;
}> = {
	dupes: {
		label: "Dupes",
		types: ["flagged_duplicate", "flagged_duplicate_image"],
		reviewable: true
	},
	flags: {
		label: "Flags",
		types: ["flagged_keyword", "flagged_bio", "flagged_domain", "flagged_honeypot", "flagged_registered_underage"],
		reviewable: true
	},
	pics: {
		label: "Pics",
		types: ["flagged_image", "image_removed", "image_quarantined"],
		reviewable: true
	},
	acks: {
		label: "Acks",
		types: ["warn_acknowledged"],
		reviewable: true
	},
	logs: {
		label: "Logs",
		types: [
			"banned",
			"unbanned",
			"indef_shadowbanned",
			"unindef_shadowbanned",
			"warned",
			"warn_revoked"
		],
		reviewable: false
	},
	admin: {
		label: "Admin",
		types: ["deleted", "payments_banned", "payments_unbanned", "appealed", "exit_survey"],
		reviewable: false,
		adminOnly: true
	}
};

const tabs: Array<{ id: ModerationQueueTab; label: string; adminOnly?: boolean }> = [
	{ id: "all", label: "All" },
	{ id: "reports", label: "Reports" },
	...Object.entries(categories).map(([id, { label, adminOnly }]) => ({ id: id as Category, label, adminOnly }))
];

const typeLabels: Record<ModerationEventType, string> = {
	banned: "Banned",
	unbanned: "Unbanned",
	indef_shadowbanned: "Indef. Shadowbanned",
	unindef_shadowbanned: "Indef. Shadowban Removed",
	warned: "Warned",
	warn_revoked: "Warning Revoked",
	warn_acknowledged: "Acknowledged",
	payments_banned: "Payments Banned",
	payments_unbanned: "Payments Unbanned",
	image_removed: "Removed",
	image_quarantined: "Quarantined",
	flagged_keyword: "Keyword",
	flagged_bio: "Bio",
	flagged_domain: "Domain",
	flagged_duplicate: "Duplicate",
	flagged_image: "Flagged",
	flagged_duplicate_image: "Duplicate Image",
	flagged_registered_underage: "Prev. Underage",
	flagged_honeypot: "Honeypot",
	appealed: "Appealed",
	deleted: "Deleted",
	exit_survey: "Exit Survey"
};

// ModerationEvent's @duplicate_types.
const duplicateKinds = [
	{ type: "display name", label: "Display Name" },
	{ type: "username", label: "Username" },
	{ type: "email", label: "Email" },
	{ type: "IP address", label: "IP Address" },
	{ type: "device ID", label: "Device ID" },
	{ type: "APNS token", label: "APNS Token" },
	{ type: "FCM token", label: "FCM Token" },
	{ type: "Discord", label: "Discord" },
	{ type: "VRChat", label: "VRChat" },
	{ type: "FaceTime", label: "FaceTime" },
	{ type: "connections", label: "Connections" }
];

const pageSize = 50;

const Tabs: FC<{
	tabs: Array<{ id: ModerationQueueTab; label: string }>;
	value: ModerationQueueTab;
	onChange: (value: ModerationQueueTab) => void;
}> = ({ tabs, value, onChange }) => {
	const index = tabs.findIndex(({ id }) => id === value);

	function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const next = {
			ArrowLeft: index - 1,
			ArrowRight: index + 1,
			Home: 0,
			End: tabs.length - 1
		}[event.key];

		if (next === undefined) return;
		event.preventDefault();

		const tab = tabs[(next + tabs.length) % tabs.length]!;
		onChange(tab.id);

		event.currentTarget
			.querySelector(`[data-tab="${tab.id}"]`)
			?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}

	return (
		<div
			className="focusable-within relative isolate grid h-11 w-full shrink-0 cursor-pointer auto-cols-[minmax(max-content,1fr)] grid-flow-col items-center overflow-x-auto rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60"
			role="tablist"
			tabIndex={0}
			onKeyDown={onKeyDown}
		>
			{tabs.map(({ id, label }) => (
				<button
					key={id}
					aria-selected={id === value}
					className="relative flex h-full items-center justify-center rounded-xl px-4 focus:outline-none aria-selected:text-white-10 vision:text-black-80"
					data-tab={id}
					role="tab"
					tabIndex={-1}
					type="button"
					onClick={() => onChange(id)}
				>
					{id === value && (
						<m.div
							className="absolute inset-0 -z-10 rounded-xl bg-brand-gradient"
							layoutId="moderation-queue-tab"
							transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
						/>
					)}
					{label}
				</button>
			))}
		</div>
	);
};

const Toggle: FC<{ id: string; label: string; value: boolean; onChange: (value: boolean) => void }> = ({ id, label, value, onChange }) => (
	<div className="flex items-center gap-2">
		<InputCheckbox id={id} value={value} onChange={onChange} />
		<InputLabel inline htmlFor={id}>{label}</InputLabel>
	</div>
);

function useReasonIds(search: string): Array<string> {
	const tAttributes = useAttributeTranslation();
	const banReasons = useAttributes("ban-reason");
	const warnReasons = useAttributes("warn-reason");
	const reportReasons = useAttributes("report-reason");
	const deleteReasons = useAttributes("delete-reason");

	return useMemo(() => {
		if (!search) return [];
		const lowerSearch = search.toLowerCase();

		return [...banReasons, ...warnReasons, ...reportReasons, ...deleteReasons]
			.map(attributeId)
			.filter((id) => tAttributes[id]?.name.toLowerCase().includes(lowerSearch));
	}, [search, banReasons, warnReasons, reportReasons, deleteReasons, tAttributes]);
}

interface QueueOptions {
	types: Array<ModerationEventType>;
	eventId?: string;
	includeReports: boolean;
	search: string;
	reasonIds: Array<string>;
	excludedDuplicateTypes: Array<string>;
	order: "asc" | "desc";
	reviewed: boolean;
	indefShadowbanned: boolean;
}

// Pages through events and reports together: each source returns up to a page
// after the cursor, and the merged page ends where either might continue.
async function fetchQueuePage(
	{ types, eventId, includeReports, search, reasonIds, excludedDuplicateTypes, order, reviewed, indefShadowbanned }: QueueOptions,
	cursor?: string
) {
	const [events, reports] = await Promise.all([
		types.length > 0
			? ModerationEvent.search({ types, eventId, search, reasonIds, excludedDuplicateTypes, reviewed, order, limit: pageSize, cursor })
			: [],
		includeReports
			? Report.list({ search, reasonIds, reviewed, indefShadowbanned, order, limit: pageSize, cursor })
			: []
	]);

	const merged = toModerationEntries(events, reports, order);
	const entries = merged.slice(0, pageSize);
	const last = entries.at(-1);
	const more = merged.length > pageSize || events.length === pageSize || reports.length === pageSize;

	return {
		entries,
		next: more && last ? `${last.createdAt},${last.kind},${last.id}` : undefined
	};
}

const QueueList: FC<{ options: QueueOptions }> = ({ options }) => {
	const toasts = useToast();

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPlaceholderData } = useInfiniteQuery({
		queryKey: ["mod-queue", options] as const,
		queryFn: ({ queryKey: [, options], pageParam }) => fetchQueuePage(options, pageParam),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: ({ next }) => next,
		placeholderData: keepPreviousData,
		staleTime: 0
	});

	const entries = data?.pages.flatMap(({ entries }) => entries) ?? [];

	const [loadMoreReference, loadMoreInView] = useInView();

	useLayoutEffect(() => {
		if (!loadMoreInView || !hasNextPage || isFetchingNextPage) return;
		void fetchNextPage();
	}, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const review = async (entry: ModerationEntry) => {
		try {
			if (entry.kind === "event") await ModerationEvent.review(entry.id);
			else await Report.clear(entry.id);
		}
		catch (reason) {
			toasts.addError(reason);
		}

		await invalidate({ queryKey: ["mod-queue"] });
	};

	if (!data) return <span className="animate-pulse">Loading…</span>;

	return (
		<div className={twMerge("flex flex-col gap-4", isPlaceholderData && "animate-pulse")}>
			<div className="flex flex-col gap-2">
				{entries.map((entry) => (
					<ModerationEntryCard
						key={`${entry.kind}-${entry.id}`}
						entry={entry}
						onReview={review}
					/>
				))}
			</div>
			{hasNextPage && (
				<div className="h-4" ref={loadMoreReference}>
					{isFetchingNextPage && <span className="animate-pulse">Loading…</span>}
				</div>
			)}
		</div>
	);
};

export const ModerationQueue: FC = () => {
	const { user: me } = useSession();
	const admin = !!me.tags?.includes("admin");

	const visibleTabs = tabs.filter(({ adminOnly }) => admin || !adminOnly);
	const visibleCategories = Object.entries(categories).filter(([, { adminOnly }]) => admin || !adminOnly);

	const [searchParameters, setSearchParameters] = useSearchParams();
	const tabParameter = searchParameters.get("tab");
	const tab = visibleTabs.find(({ id }) => id === tabParameter)?.id ?? "all";
	const targetId = searchParameters.get("targetId") || undefined;
	const userId = searchParameters.get("userId") || undefined;
	const eventId = (tab !== "reports" && searchParameters.get("eventId")) || undefined;
	const filtered = (tab === "reports" && !!(targetId || userId)) || !!eventId;

	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search.trim());
	const reasonIds = useReasonIds(deferredSearch);

	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [toggles, setToggles] = useState<{ reviewed?: boolean; indefShadowbanned?: boolean }>({});
	const reviewed = toggles.reviewed ?? filtered;
	const indefShadowbanned = toggles.indefShadowbanned ?? filtered;

	// Hidden categories (on All) and event types (on the other tabs).
	const [hidden, setHidden] = useState<Array<string>>([]);
	const shown = (key: string) => !hidden.includes(key);
	const setShown = (key: string, value: boolean) =>
		setHidden((previous) => value ? previous.filter((item) => item !== key) : [...previous, key]);

	// On Dupes, flagged duplicates split by the kind of identifier they share.
	const splitDuplicates = tab === "dupes";

	const filters: Array<{ key: string; label: string }> = tab === "all"
		? visibleTabs.filter(({ id }) => id !== "all").map(({ id, label }) => ({ key: id, label }))
		: tab === "reports"
			? []
			: categories[tab].types.flatMap((type) =>
					type === "flagged_duplicate" && splitDuplicates
						? duplicateKinds.map(({ type, label }) => ({ key: `duplicate:${type}`, label }))
						: [{ key: type, label: typeLabels[type] }]
				);

	const excludedDuplicateTypes = splitDuplicates
		? duplicateKinds.filter(({ type }) => !shown(`duplicate:${type}`)).map(({ type }) => type)
		: [];

	const types = tab === "all"
		? visibleCategories
				.filter(([category]) => shown(category))
				.flatMap(([, { types }]) => types)
		: tab === "reports"
			? []
			: categories[tab].types.filter((type) =>
					type === "flagged_duplicate" && splitDuplicates
						? excludedDuplicateTypes.length < duplicateKinds.length
						: shown(type)
				);

	const reviewable = tab === "all" || tab === "reports" || categories[tab].reviewable;

	const setTab = (id: ModerationQueueTab) => {
		setSearchParameters((previous) => {
			previous.set("tab", id);
			previous.delete("eventId");
			previous.delete("targetId");
			previous.delete("userId");
			return previous;
		});
		if (filtered) setToggles({});
	};

	const clearFilter = (key: "eventId" | "targetId" | "userId") => {
		setSearchParameters((previous) => {
			previous.delete(key);
			return previous;
		});
		setToggles({});
	};

	return (
		<ModelCard
			data-block
			className="desktop:max-w-4xl"
			containerProps={{ className: "gap-6 min-h-screen" }}
			title="Mod Queue"
		>
			<Tabs tabs={visibleTabs} value={tab} onChange={setTab} />
			<div className="flex flex-col gap-4 wide:flex-row wide:items-center">
				<div className="flex grow flex-col">
					<InputText
						className="grow"
						Icon={Search}
						placeholder="Search queue"
						value={search}
						onChange={setSearch}
					/>
				</div>
				<InputSwitch
					no="Oldest"
					value={order === "desc"}
					yes="Newest"
					onChange={(value) => setOrder(value ? "desc" : "asc")}
				/>
			</div>
			{filtered && (
				<div className="flex flex-wrap gap-2">
					{([
						["eventId", "Event", eventId && <span className="font-mono">{eventId}</span>],
						["targetId", "Target", targetId && <UserDisplayName userId={targetId} />],
						["userId", "Reporter", userId && <UserDisplayName userId={userId} />]
					] as const).map(([key, label, value]) => value && (
						<span key={key} className="flex items-center gap-1 rounded-full bg-white-40 px-3 py-1 text-sm dark:bg-black-60">
							{label}
							:
							{" "}
							{value}
							<button type="button" onClick={() => clearFilter(key)}>
								<X className="size-4" />
							</button>
						</span>
					))}
				</div>
			)}
			{filters.length > 1 && (
				<div className="flex flex-wrap gap-x-6 gap-y-2">
					{filters.map(({ key, label }) => (
						<Toggle
							id={`show-${key}`}
							key={key}
							label={label}
							value={shown(key)}
							onChange={(value) => setShown(key, value)}
						/>
					))}
				</div>
			)}
			<div className="flex flex-wrap gap-x-6 gap-y-2">
				{reviewable && (
					<Toggle
						id="reviewed"
						label="Include reviewed"
						value={reviewed}
						onChange={(value) => setToggles((previous) => ({ ...previous, reviewed: value }))}
					/>
				)}
				{(tab === "all" || tab === "reports") && (
					<Toggle
						id="indefShadowbanned"
						label="Include indef. shadowbanned"
						value={indefShadowbanned}
						onChange={(value) => setToggles((previous) => ({ ...previous, indefShadowbanned: value }))}
					/>
				)}
			</div>
			<Suspense fallback={<span className="animate-pulse">Loading…</span>}>
				{tab === "reports"
					? (
							<ReportsTab
								options={{
									reviewed,
									indefShadowbanned,
									search: deferredSearch,
									reasonIds,
									order,
									...(targetId && { targetId }),
									...(userId && { userId })
								}}
								filtered={filtered}
							/>
						)
					: (
							<QueueList
								options={{
									types,
									eventId,
									includeReports: tab === "all" && !eventId && shown("reports"),
									search: deferredSearch,
									reasonIds,
									excludedDuplicateTypes,
									order,
									reviewed,
									indefShadowbanned
								}}
							/>
						)}
			</Suspense>
		</ModelCard>
	);
};
