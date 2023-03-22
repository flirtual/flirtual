import { SoleModelLayout } from "~/components/layout/sole-model";
import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { User } from "~/api/user";
import { Report } from "~/api/report";

const Report: React.FC<{ reporter: User; user: User; report: Report }> = ({
	reporter,
	user,
	report
}) => {
	return (
		<div className="mb-4 w-full max-w-lg rounded-xl border-4 border-coral bg-white-20 p-4">
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
		</div>
	);
};

export default async function ReportPage() {
	const reports = await api.report.list({ ...thruServerCookies(), query: {} });
	const users = await api.user.bulk({
		...thruServerCookies(),
		body: [
			...new Set([
				...reports.map((report) => report.userId),
				...reports.map((report) => report.targetId)
			])
		]
	});

	return (
		<SoleModelLayout>
			<p>{reports.length} reports</p>
			{reports.map((report) => (
				<Report
					key={report.id}
					report={report}
					reporter={users.find((user) => user.id === report.userId)!}
					user={users.find((user) => user.id === report.targetId)!}
				/>
			))}
		</SoleModelLayout>
	);
}
