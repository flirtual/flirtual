"use client";

import {
	createContext,
	type Dispatch,
	type SetStateAction,
	useContext,
	useMemo,
	useState
} from "react";
import useSWR, { type KeyedMutator } from "swr";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import {
	Check,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	MessagesSquare,
	ShieldCheck
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { ListOptions, Report } from "~/api/report";

import { api } from "~/api";
import { displayName, type User } from "~/api/user";
import { ModelCard } from "~/components/model-card";
import { entries, groupBy, newConversationId, sortBy } from "~/utilities";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { TimeRelative } from "~/components/time-relative";
import { DateTimeRelative } from "~/components/datetime-relative";
import { ProfileDropdown } from "~/components/profile/dropdown";
import { InputCheckbox, InputLabel } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";

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
	reported?: User;
	reports: Array<CompleteReport>;
}

const ProfileReportView: React.FC<ProfileReportViewProps> = ({
	reported,
	reports
}) => {
	const [collapsed, setCollapsed] = useState(reports.length >= 2);
	const { mutate } = useContext(ReportListContext);
	const toasts = useToast();
	const router = useRouter();
	const [session] = useSession();

	const CollapseIcon = collapsed ? ChevronRight : ChevronDown;

	const activeReports = reports.filter((report) => !report.reviewedAt);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col">
				<div className="flex items-center justify-between gap-4 desktop:justify-start">
					<button
						className="flex h-fit items-center gap-4 text-left"
						type="button"
						onClick={() => setCollapsed((collapsed) => !collapsed)}
					>
						<CollapseIcon className="size-6" />
						<span className="w-44 truncate font-montserrat text-xl font-semibold">
							{reported ? displayName(reported) : "Deleted user"}
						</span>
					</button>
					{reported && (
						<div className="flex gap-4">
							<Tooltip>
								<TooltipTrigger asChild>
									<Link href={urls.profile(reported)}>
										<ExternalLink className="size-6" />
									</Link>
								</TooltipTrigger>
								<TooltipContent>View profile</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="h-fit"
										type="button"
										onClick={async () => {
											await api.report
												.clearAll({ query: { targetId: reported.id } })
												.then(({ count }) =>
													toasts.add(
														`Cleared ${count} report${count === 1 ? "" : "s"}`
													)
												);

											await mutate();
										}}
									>
										<ShieldCheck className="size-6 text-green-600" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Clear reports</TooltipContent>
							</Tooltip>
							<ProfileDropdown user={reported} />
						</div>
					)}
				</div>
				<div className="flex items-baseline justify-between gap-4 pl-10 desktop:justify-start">
					<span className="text-black-50 dark:text-white-50">
						{activeReports.length} active
						{reports.length - activeReports.length
							? `, ${reports.length - activeReports.length} cleared`
							: ""}{" "}
						reports
					</span>
					{reported && reported.indefShadowbannedAt ? (
						<span className="font-bold text-red-600">
							Indefinitely shadowbanned
						</span>
					) : (
						reported &&
						reported.shadowbannedAt && (
							<span className="font-bold text-red-600">Shadowbanned</span>
						)
					)}
				</div>
			</div>
			<div className="flex flex-col pl-10">
				{collapsed ? (
					<button
						className="flex flex-col"
						type="button"
						onClick={() => setCollapsed(false)}
					>
						{entries(groupBy(activeReports, (report) => report.reason.id))
							.sort()
							.map(([reasonId, reports]) => (
								<div className="flex gap-2" key={reasonId}>
									<span>{`${reports.length}x`}</span>
									{reports[0] && (<span>{reports[0].reason.name}</span>)}
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
								<div className="flex justify-between gap-4">
									<div className="flex flex-col">
										<span
											suppressHydrationWarning
											className="text-xs text-black-50 first-letter:capitalize dark:text-white-50"
										>
											<TimeRelative
												approximate
												suffix="since"
												value={report.createdAt}
											/>{" "}
											<DateTimeRelative value={report.createdAt} />
										</span>
										<span className="text-lg font-semibold">
											{report.reason.name}
										</span>
										<div className="flex items-baseline gap-1">
											Reporter:
											<InlineLink
												href={
													report.user
														? urls.profile(report.user)
														: urls.moderation.reports()
												}
											>
												{report.user
													? displayName(report.user)
													: "Deleted user"}
											</InlineLink>
										</div>
									</div>
									{!report.reviewedAt && (
										<div className="flex flex-col gap-4">
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														onClick={async () => {
															await api.report.clear(report.id);

															toasts.add("Cleared single report");
															await mutate();
														}}
													>
														<Check className="size-5 text-green-600" />
													</button>
												</TooltipTrigger>
												<TooltipContent>Clear single report</TooltipContent>
											</Tooltip>
											{session?.user.tags?.includes("admin") &&
												report.userId && (
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={async () => {
																	const conversationId = newConversationId(
																		report.userId!,
																		report.targetId
																	);
																	await api.conversations.observe(
																		conversationId
																	);
																	router.push(
																		urls.conversations.of(conversationId)
																	);
																}}
															>
																<MessagesSquare className="size-5" />
															</button>
														</TooltipTrigger>
														<TooltipContent>
															Observe conversation
														</TooltipContent>
													</Tooltip>
												)}
										</div>
									)}
								</div>
								{report.message && (
									<p className="whitespace-pre-wrap">{report.message}</p>
								)}
								{report.images && report.images.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{report.images.map((image) => (
											<Link
												href={urls.media(image, "pfpup")}
												key={image}
												target="_blank"
											>
												{!image.includes(".") ||
												/\.(jpg|jpeg|png|gif|webm)$/i.test(image) ? (
													<Image
														alt="Report attachment"
														className="rounded-md"
														height={128}
														src={urls.media(image, "pfpup")}
														width={128}
													/>
												) : (
													image.split("-").pop()
												)}
											</Link>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export const ReportView: React.FC = () => {
	const [listOptions, setListOptions] = useState<ListOptions>({
		query: { reviewed: false, indefShadowbanned: false }
	});

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

	const grouped = useMemo(
		() => groupBy(reports, ({ targetId }) => targetId),
		[reports]
	);

	return (
		<ReportListContext.Provider
			value={useMemo(
				() =>
					({
						listOptions,
						reports,
						setListOptions,
						mutate
					}) as ReportListContext,
				[listOptions, setListOptions, reports, mutate]
			)}
		>
			<ModelCard
				className="desktop:max-w-4xl"
				containerProps={{ className: "gap-8 min-h-screen" }}
				title="Reports"
			>
				<div className="flex gap-8">
					<div className="flex items-center gap-4">
						<InputCheckbox
							id="reviewed"
							value={listOptions.query.reviewed}
							onChange={(value) => {
								setListOptions((listOptions) => ({
									...listOptions,
									query: {
										...listOptions.query,
										reviewed: value
									}
								}));
							}}
						/>
						<InputLabel inline htmlFor="reviewed">
							Include reviewed
						</InputLabel>
					</div>
					<div className="flex items-center gap-4">
						<InputCheckbox
							id="indefShadowbanned"
							value={listOptions.query.indefShadowbanned}
							onChange={(value) => {
								setListOptions((listOptions) => ({
									...listOptions,
									query: {
										...listOptions.query,
										indefShadowbanned: value
									}
								}));
							}}
						/>
						<InputLabel inline htmlFor="indefShadowbanned">
							Include indef. shadowbanned
						</InputLabel>
					</div>
				</div>
				<div>
					<span>{reports.length} reports</span>
				</div>
				<div className="flex flex-col gap-4">
					{entries(grouped).map(([targetId, reports]) => (
						<ProfileReportView
							key={targetId}
							reported={reports[0]?.target}
							reports={reports}
						/>
					))}
				</div>
			</ModelCard>
		</ReportListContext.Provider>
	);
};
