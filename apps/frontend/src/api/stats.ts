import type { WretchOptions } from "wretch";

import { api } from "./common";

export type StatFormat = "count" | "percent";

export interface StatDimensionOption {
	value: string;
	label: string;
	description?: string;
	title?: string;
}

export interface StatDimension {
	key: string;
	label: string;
	options: Array<StatDimensionOption>;
}

export interface StatSeries {
	key: string;
	label: string;
}

export interface StatDefinition {
	key: string;
	label: string;
	title: string;
	format: StatFormat;
	// Cohort metrics plot against the date their cohort registered, not the date
	// they were measured, so a cause lands at the same x on every chart.
	x: "cohort_date" | "date";
	// "band" reads its series as [p25, p50, p75] and shades between the outer two.
	chart: "band" | "line";
	series: Array<StatSeries>;
	// A template when `dimensions` is present, e.g. "mutual_{kinds}_{segment}".
	name: string;
	dimensions?: Array<StatDimension>;
}

export interface StatIndex {
	updatedAt: string;
	stats: Array<StatDefinition>;
}

export type StatRow = Array<number | string | null>;

export interface StatData {
	name: string;
	columns: Array<string>;
	rows: Array<StatRow>;
}

export function statName(
	{ name, dimensions }: StatDefinition,
	selection: Record<string, string>
) {
	if (!dimensions) return name;

	return dimensions.reduce(
		(name, { key }) => name.replace(`{${key}}`, selection[key] ?? ""),
		name
	);
}

export const Stats = {
	api: api.url("/stats"),

	index(options: WretchOptions = {}) {
		return this.api.options(options).get().json<StatIndex>();
	},

	get(name: string, options: WretchOptions = {}) {
		return this.api.url(`/${name}`).options(options).get().json<StatData>();
	},

	// The bucket has no public url, so the file is fetched through the session
	// and handed to the browser as an object url rather than linked directly.
	async download(name: string) {
		const blob = await this.api.url(`/${name}/download`).get().blob();
		const url = URL.createObjectURL(blob);

		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `${name}.csv`;
		anchor.click();

		URL.revokeObjectURL(url);
	}
};
