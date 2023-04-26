"use client";
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { createContext, Dispatch, SetStateAction, useContext, useMemo, useState } from "react";
import useSWR, { KeyedMutator } from "swr";
import { twMerge } from "tailwind-merge";
import {
	ArrowTopRightOnSquareIcon,
	MinusSmallIcon,
	PlusIcon,
	ShieldCheckIcon
} from "@heroicons/react/24/solid";
import Link from "next/link";
import ms from "ms";
import { CheckIcon } from "@heroicons/react/24/outline";

import { api } from "~/api";
import { displayName, User } from "~/api/user";
import { ModelCard } from "~/components/model-card";
import { entries, groupBy, sortBy } from "~/utilities";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { ListOptions, Report } from "~/api/report";
import { BanProfile } from "~/components/profile/action-bar/ban-profile";
import { Tooltip } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";

type CompleteReport = Report & { user?: User; target: User };

interface ReportListContext {
	listOptions: ListOptions;
	reports: Array<CompleteReport>;
	setListOptions: Dispatch<SetStateAction<ListOptions>>;
	mutate: KeyedMutator<Array<CompleteReport>>;
}

const ReportListContext = createContext<ReportListContext>({
	listOptions: { query: {} },
	reports: [],
	setListOptions: () => void 0,
	mutate: async () => void 0
});

interface ProfileReportViewProps {
	reported: User;
	reports: Array<CompleteReport>;
}

const ProfileReportView: React.FC<ProfileReportViewProps> = ({ reported, reports }) => {
	const [collapsed, setCollapsed] = useState(reports.length >= 2);
	const { mutate } = useContext(ReportListContext);
	const toasts = useToast();

	const CollapseIcon = collapsed ? PlusIcon : MinusSmallIcon;

	const activeReports = reports.filter((report) => !report.reviewedAt);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col">
				<div className="flex items-center justify-between gap-4 sm:justify-start">
					<button
						className="flex h-fit gap-4 text-left"
						type="button"
						onClick={() => setCollapsed((collapsed) => !collapsed)}
					>
						<CollapseIcon className="h-6 w-6" />
						<span className="w-44 truncate font-montserrat text-xl font-semibold">
							{displayName(reported)}
						</span>
					</button>
					<div className="flex gap-4">
						<Tooltip value="View profile">
							<Link href={urls.user.profile(reported.username)}>
								<ArrowTopRightOnSquareIcon className="h-6 w-6" />
							</Link>
						</Tooltip>
						<Tooltip value="Clear reports">
							<button
								className="h-fit"
								type="button"
								onClick={async () => {
									await api.report
										.clearAll({ query: { targetId: reported.id } })
										.then(({ count }) =>
											toasts.add({
												type: "success",
												label: `Successfully cleared ${count} report${count !== 1 ? "s" : ""}`,
												children: <span className="text-sm">User: {reported.id}</span>
											})
										);

									await mutate();
								}}
							>
								<ShieldCheckIcon className="h-6 w-6" />
							</button>
						</Tooltip>
						<BanProfile user={reported} />
					</div>
				</div>
				<div className="flex items-baseline justify-between gap-4 pl-10 sm:justify-start">
					<span className="text-black-50 dark:text-white-50">
						{activeReports.length} active
						{reports.length - activeReports.length
							? `, ${reports.length - activeReports.length} cleared`
							: ""}{" "}
						reports
					</span>
					{reported.shadowbannedAt && <span className="font-bold text-red-600">Shadowbanned</span>}
				</div>
			</div>
			<div className="flex flex-col pl-10">
				{collapsed ? (
					<button className="flex flex-col" type="button" onClick={() => setCollapsed(false)}>
						{entries(groupBy(activeReports, (report) => report.reason.id))
							.sort()
							.map(([reasonId, reports]) => (
								<div className="flex gap-2" key={reasonId}>
									<span>{`${reports.length}x`}</span>
									<span>{reports[0].reason.name}</span>
								</div>
							))}
					</button>
				) : (
					<div className="flex flex-col gap-2">
						{sortBy(reports, "createdAt", 1).map((report) => (
							<div
								key={report.id}
								className={twMerge(
									"flex flex-col gap-2 rounded-xl bg-white-30 p-4 dark:bg-black-80",
									report.reviewedAt && "brightness-75"
								)}
							>
								<div className="flex flex-col">
									<span
										suppressHydrationWarning
										className="text-xs text-black-50 dark:text-white-50"
									>{`${new Date(report.createdAt).toLocaleString()} (${ms(
										Date.now() - new Date(report.createdAt).getTime(),
										{
											long: true
										}
									)} ago)`}</span>
									<div className="flex items-center justify-between gap-4 pr-3">
										<span className="text-lg font-semibold">{report.reason.name}</span>
										{!report.reviewedAt && (
											<Tooltip value="Clear single report">
												<button
													className="h-fit"
													type="button"
													onClick={async () => {
														await api.report.clear(report.id);

														toasts.add({
															type: "success",
															label: "Cleared report successfully!"
														});

														await mutate();
													}}
												>
													<CheckIcon className="h-5 w-5" strokeWidth={2} />
												</button>
											</Tooltip>
										)}
									</div>
								</div>
								<div className="flex items-baseline gap-1">
									Reporter:
									<InlineLink
										href={
											report.user
												? urls.user.profile(report.user.username)
												: urls.moderation.reports
										}
									>
										{report.user ? displayName(report.user) : "Unknown"}
									</InlineLink>
								</div>
								<p className="whitespace-pre-wrap">{report.message}</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export const ReportView: React.FC = () => {
	const [listOptions, setListOptions] = useState<ListOptions>({ query: { reviewed: false } });

	const { data: reports = [], mutate } = useSWR(
		["reports", listOptions],
		async ([, listOptions]) => {
			const reports = await api.report.list(listOptions);
			const users = await api.user.bulk({
				body: [
					...new Set([
						...reports.map((report) => report.userId),
						...reports.map((report) => report.targetId)
					])
				].filter(Boolean)
			});

			return reports.map((report) => ({
				...report,
				user: users.find((user) => user.id === report.userId),
				target: users.find((user) => user.id === report.targetId)!
			}));
		}
	);

	const grouped = useMemo(() => groupBy(reports, ({ targetId }) => targetId), [reports]);

	return (
		<ReportListContext.Provider
			value={useMemo(
				() => ({ listOptions, reports, setListOptions, mutate } as ReportListContext),
				[listOptions, setListOptions, reports, mutate]
			)}
		>
			<ModelCard className="sm:max-w-4xl" containerProps={{ className: "gap-8" }} title="Reports">
				<div>
					<span>{reports.length} reports</span>
				</div>
				<div className="flex flex-col gap-4">
					{entries(grouped).map(([targetId, reports]) => (
						<ProfileReportView key={targetId} reported={reports[0].target} reports={reports} />
					))}
				</div>
			</ModelCard>
		</ReportListContext.Provider>
	);
};
