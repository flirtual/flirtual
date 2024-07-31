import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { Table, TableBody, TableCell, TableRow } from "~/components/table";
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
	...[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
		(n) => `retention_${n}`
	),
	...[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
		(n) => `retention_visible_${n}`
	),
	...[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
		(n) => `retention_premium_${n}`
	),
	...[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
		(n) => `retention_premium_subscription_${n}`
	),
	...[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
		(n) => `retention_premium_lifetime_${n}`
	),
	...[
		{ min: 18, max: 21 },
		{ min: 18, max: 25 },
		{ min: 26, max: 29 },
		{ min: 30, max: 34 },
		{ min: 35, max: Number.POSITIVE_INFINITY }
	].flatMap(({ min, max }) =>
		[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
			(n) =>
				`retention_age_${min}_${max === Number.POSITIVE_INFINITY ? "plus" : max}_${n}`
		)
	),
	...["men", "women", "other"].flatMap((gender) =>
		[1, 2, 7, 14, 30, 60, 90, 180, 365, "bracket"].map(
			(n) => `retention_gender_${gender}_${n}`
		)
	)
];

export default function StatsPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full desktop:max-w-xl"
				containerProps={{ className: "!p-0" }}
				title="Stats"
			>
				<Table>
					<TableBody className="text-center">
						{stats.map((stat) => (
							<TableRow key={stat}>
								<TableCell className="text-left font-bold">{stat}</TableCell>
								<TableCell>
									<a className="text-pink" href={urls.admin.statsData(stat)}>
										Data
									</a>
								</TableCell>
								<TableCell>
									<a className="text-pink" href={urls.admin.statsChart(stat)}>
										Chart
									</a>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</ModelCard>
		</SoleModelLayout>
	);
}
