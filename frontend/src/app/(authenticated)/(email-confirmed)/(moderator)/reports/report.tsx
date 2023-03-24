"use client";

import { Report } from "~/api/report";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { User } from "~/api/user";
import { api } from "~/api";

export interface ReportCardProps {
	reporter: User;
	user: User;
	report: Report;
}

export const ReportCard: React.FC<ReportCardProps> = ({ reporter, user, report }) => {
	return (
		<div className="mb-4 w-full max-w-lg rounded-xl border-4 border-coral bg-white-20 p-4 dark:bg-black-70 dark:text-white-20">
			{user.shadowbannedAt && <span className="font-semibold text-red-600">Shadowbanned!</span>}
			<p>
				User:{" "}
				<InlineLink href={urls.user.profile(user.username)}>
					{user.profile.displayName || user.username}
				</InlineLink>
			</p>
			<p>
				Reporter:{" "}
				<InlineLink href={urls.user.profile(reporter.username)}>
					{reporter.profile.displayName || reporter.username}
				</InlineLink>
			</p>
			<p>Date: {report.createdAt}</p>
			<p>Reason: {report.reason.name}</p>
			<p>Details: {report.message}</p>
			{!report.reviewedAt && (
				<button
					className="text-pink"
					type="button"
					onClick={async () => {
						await api.report.clear(report.id);
					}}
				>
					Clear report
				</button>
			)}
		</div>
	);
};
