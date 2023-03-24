"use client";
import { useState } from "react";
import useSWR from "swr";

import { api } from "~/api";
import { InputCheckbox, InputLabel } from "~/components/inputs";
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ReportCard } from "./report";

export const ReportView: React.FC = () => {
	const [includeReviewed, setIncludeReviewed] = useState(false);

	const { data = { reports: [], users: [] } } = useSWR(
		["reports", { query: { reviewed: includeReviewed } }],
		async ([, options]) => {
			const reports = await api.report.list(options);
			const users = await api.user.bulk({
				body: [
					...new Set([
						...reports.map((report) => report.userId),
						...reports.map((report) => report.targetId)
					])
				]
			});

			return { reports, users };
		}
	);

	const { reports, users } = data;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4">
				<InputCheckbox value={includeReviewed} onChange={setIncludeReviewed} />
				<InputLabel>Include Reviewed</InputLabel>
			</div>
			<p>{reports.length} reports</p>
			<div className="flex flex-col gap-4">
				{reports.map((report) => (
					<ReportCard
						key={report.id}
						report={report}
						reporter={users.find((user) => user.id === report.userId)!}
						user={users.find((user) => user.id === report.targetId)!}
					/>
				))}
			</div>
		</div>
	);
};
