import invariant from "tiny-invariant";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { Table, TableBody, TableCell, TableRow } from "~/components/table";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

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
		(n) => `retention_all_${n}`
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
		{ min: 22, max: 25 },
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

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([...rootMeta(options), { title: t("page_title", { name: "Stats" }) }]);
};

export default function StatsPage() {
	return (
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
								<InlineLink href={urls.admin.statsData(stat)}>Data</InlineLink>
							</TableCell>
							<TableCell>
								<InlineLink href={urls.admin.statsChart(stat)}>
									Chart
								</InlineLink>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</ModelCard>
	);
}
