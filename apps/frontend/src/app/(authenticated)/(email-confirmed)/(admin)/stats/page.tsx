import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

const stats = [
	"dau",
	"wau",
	"mau",
	"users",
	"registrations",
	"likes",
	"homies",
	"matches",
	"reports",
	"bans",
	"visible",
	...[1, 2, 7, 14, 30, 60, 90, 180, 365].map((n) => `retention_${n}`),
	...[1, 2, 7, 14, 30, 60, 90, 180, 365].map((n) => `retention_visible_${n}`),
	"retention_bracket"
];

export default function StatsPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full sm:max-w-2xl" title="Stats">
				{stats.map((stat) => (
					<div className="flex justify-between" key={stat}>
						{stat}
						<div className="flex gap-2">
							<a className="underline" href={urls.admin.statsData(stat)}>
								Data
							</a>
							<a className="underline" href={urls.admin.statsChart(stat)}>
								Chart
							</a>
						</div>
					</div>
				))}
			</ModelCard>
		</SoleModelLayout>
	);
}
