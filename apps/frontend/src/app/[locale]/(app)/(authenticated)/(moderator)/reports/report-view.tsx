"use client";

import {
	Check,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	MessagesSquare,
	ShieldCheck
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type {
	ComponentProps,
	FC
} from "react";
import {
	Suspense,
	useMemo,
	useState
} from "react";
import { entries, groupBy, prop, sortBy } from "remeda";
import { twMerge } from "tailwind-merge";

import { Conversation } from "~/api/conversations";
import { type ListReportOptions, Report } from "~/api/report";
import { displayName } from "~/api/user";
import { DateTimeRelative } from "~/components/datetime-relative";
import { Dialog, DialogContent } from "~/components/dialog/dialog";
import { InlineLink } from "~/components/inline-link";
import { InputCheckbox, InputLabel } from "~/components/inputs";
import { Link } from "~/components/link";
import { ModelCard } from "~/components/model-card";
import { ProfileDropdown } from "~/components/profile/dropdown";
import { TimeRelative } from "~/components/time-relative";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useOptionalSession } from "~/hooks/use-session";
import { ConversationChatbox } from "~/hooks/use-talkjs";
import { useToast } from "~/hooks/use-toast";
import { useUser } from "~/hooks/use-user";
import { withSuspense } from "with-suspense";
import { useQuery } from "~/query";
import { urls } from "~/urls";
import { newConversationId } from "~/utilities";

interface ProfileReportViewProps {
	targetId?: string;
	reports: Array<Report>;
}

function useReports(options: ListReportOptions = {}) {
	return useQuery({
		queryKey: ["reports", options],
		queryFn: () => Report.list(options),
		placeholderData: []
	});
}

const UserDisplayName: FC<{ userId?: string } & ComponentProps<"span">> = withSuspense(({ userId = "", ...props }) => {
	const user = useUser(userId);

	return (
		<span {...props}>
			{user ? displayName(user) : "Deleted user"}
		</span>
	);
}, {
	fallback: ({ className, userId, ...props }) => (
		<span {...props} className={twMerge("animate-pulse", className)}>
			{userId}
		</span>
	)
});

const UserShadowban: FC<{ userId?: string }> = withSuspense(({ userId = "" }) => {
	const user = useUser(userId);
	if (!user) return null;

	if (user.indefShadowbannedAt) {
		return (
			<span className="font-bold text-red-600">
				Indefinitely shadowbanned
			</span>
		);
	}

	if (user.shadowbannedAt) {
		return (
			<span className="font-bold text-red-600">Shadowbanned</span>
		);
	}
});

const ProfileReportView: React.FC<ProfileReportViewProps> = ({
	targetId,
	reports
}) => {
	const [collapsed, setCollapsed] = useState(reports.length >= 2);
	const [observedConversation, setObservedConversation] = useState<
		string | null
	>(null);
	const toasts = useToast();
	const session = useOptionalSession();
	const t = useTranslations();
	const tAttributes = useAttributeTranslation();

	const CollapseIcon = collapsed ? ChevronRight : ChevronDown;

	const activeReports = reports.filter((report) => !report.reviewedAt);

	const { mutate } = useReports();

	return (
		<>
			{observedConversation && (
				<Dialog
					open
					onOpenChange={(open) => {
						if (open) return;
						setObservedConversation(null);
					}}
				>
					<DialogContent className="rounded-2xl">
						<ConversationChatbox conversationId={observedConversation} />
					</DialogContent>
				</Dialog>
			)}
			<div className="flex flex-col gap-2">
				<div className="flex flex-col">
					<div className="flex items-center justify-between gap-4 desktop:justify-start">
						<button
							className="flex h-fit items-center gap-4 text-left"
							type="button"
							onClick={() => setCollapsed((collapsed) => !collapsed)}
						>
							<CollapseIcon className="size-6" />
							<UserDisplayName
								className="max-w-44 select-text truncate font-montserrat text-xl font-semibold"
								userId={targetId}
							/>
						</button>
						{targetId && (
							<div className="flex gap-4">
								<Tooltip>
									<TooltipTrigger asChild>
										<Link href={urls.profile(targetId)}>
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
											onClick={() =>
												Report.clearAll(targetId)
													.then(({ count }) =>
														toasts.add(t("cleared_count_reports", { count }))
													)
													.catch(toasts.addError)
													.finally(mutate)}
										>
											<ShieldCheck className="size-6 text-green-600" />
										</button>
									</TooltipTrigger>
									<TooltipContent>Clear reports</TooltipContent>
								</Tooltip>
								<Suspense>
									<ProfileDropdown userId={targetId} />
								</Suspense>
							</div>
						)}
					</div>
					<div className="flex items-baseline justify-between gap-4 pl-10 desktop:justify-start">
						<span className="text-black-50 dark:text-white-50">
							{activeReports.length}
							{" "}
							active
							{reports.length - activeReports.length
								? `, ${reports.length - activeReports.length} cleared`
								: ""}
							{" "}
							reports
						</span>
						<UserShadowban userId={targetId} />
					</div>
				</div>
				<div className="flex flex-col pl-10">
					{collapsed
						? (
								<button
									className="flex flex-col"
									type="button"
									onClick={() => setCollapsed(false)}
								>
									{entries(groupBy(activeReports, (report) => report.reasonId))
										.sort()
										.map(([reasonId, reports]) => {
											return (
												<div className="flex gap-2" key={reasonId}>
													<span>{`${reports.length}x`}</span>
													<span>{tAttributes[reasonId]?.name || reasonId}</span>
												</div>
											);
										})}
								</button>
							)
						: (
								<div className="flex flex-col gap-2">
									{sortBy(reports, prop("createdAt")).map((report) => (
										<div
											className={twMerge(
												"flex flex-col gap-2 rounded-xl bg-white-30 p-4 dark:bg-black-80",
												report.reviewedAt && "brightness-75"
											)}
											key={report.id}
										>
											<div className="flex justify-between gap-4">
												<div className="flex flex-col">
													<span
														suppressHydrationWarning
														className="text-xs text-black-50 first-letter:capitalize dark:text-white-50"
													>
														<TimeRelative value={report.createdAt} />
														{" "}
														<DateTimeRelative value={report.createdAt} />
													</span>
													<span className="text-lg font-semibold">
														{tAttributes[report.reasonId]?.name || report.reasonId}
													</span>
													<div className="flex items-baseline gap-1">
														Reporter:
														<InlineLink
															href={
																report.userId
																	? urls.profile(report.userId)
																	: urls.moderation.reports()
															}
															className="select-children"
														>
															<UserDisplayName userId={report.userId} />
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
																		await Report.clear(report.id);

																		toasts.add(t("cleared_single_report"));
																		await mutate();
																	}}
																>
																	<Check className="size-5 text-green-600" />
																</button>
															</TooltipTrigger>
															<TooltipContent>Clear single report</TooltipContent>
														</Tooltip>
														{session?.user.tags?.includes("admin")
														&& report.userId && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<button
																		type="button"
																		onClick={async () => {
																			await Conversation.observe({
																				userId: report.userId!,
																				targetId: report.targetId
																			});

																			const conversationId
																				= await newConversationId(
																					report.userId!,
																					report.targetId
																				);
																			setObservedConversation(conversationId);
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
												<p className="select-text whitespace-pre-wrap">{report.message}</p>
											)}
											{report.images && report.images.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{report.images.map((image) => (
														<Link
															href={urls.media(image, "uploads")}
															key={image}
															target="_blank"
														>
															{!image.includes(".")
															|| /\.(?:jpg|jpeg|png|gif|webm)$/i.test(image)
																? (
																		<Image
																			alt="Report attachment"
																			className="rounded-md"
																			height={128}
																			src={urls.media(image, "uploads")}
																			width={128}
																		/>
																	)
																: (
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
		</>
	);
};

export const ReportView: React.FC = () => {
	const [options, setOptions] = useState<ListReportOptions>({
		reviewed: false,
		indefShadowbanned: false
	});

	const { data: reports = [] } = useReports(options);

	const grouped = useMemo(
		() => groupBy(reports, ({ targetId }) => targetId),
		[reports]
	);

	return (

		<ModelCard
			data-block
			className="desktop:max-w-4xl"
			containerProps={{ className: "gap-8 min-h-screen" }}
			title="Reports"
		>
			<div className="flex gap-8">
				<div className="flex items-center gap-4">
					<InputCheckbox
						id="reviewed"
						value={options.reviewed}
						onChange={(value) => {
							setOptions((options) => ({
								...options,
								reviewed: value
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
						value={options.indefShadowbanned}
						onChange={(value) => {
							setOptions((options) => ({
								...options,
								indefShadowbanned: value
							}));
						}}
					/>
					<InputLabel inline htmlFor="indefShadowbanned">
						Include indef. shadowbanned
					</InputLabel>
				</div>
			</div>
			<div>
				<span>
					{reports.length}
					{" "}
					reports
				</span>
			</div>
			<div className="flex flex-col gap-4">
				{entries(grouped).map(([targetId, reports]) => (
					<ProfileReportView
						key={targetId}
						reports={reports}
						targetId={reports[0]?.targetId}
					/>
				))}
			</div>
		</ModelCard>
	);
};
