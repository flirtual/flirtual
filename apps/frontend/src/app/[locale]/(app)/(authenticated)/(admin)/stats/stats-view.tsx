import { Download } from "lucide-react";
import { Suspense, useDeferredValue, useMemo, useState } from "react";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import type { StatDefinition } from "~/api/stats";
import { statName, Stats } from "~/api/stats";
import { InputSelect } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { useToast } from "~/hooks/use-toast";
import { useQuery } from "~/query";

import { Chart } from "./chart";

const statsIndexKey = () => ["stats-index"] as const;
const statSeriesKey = (name: string) => ["stat-series", name] as const;

function resolveSelection(
	stat: StatDefinition,
	overrides: Record<string, string>
) {
	return Object.fromEntries(
		(stat.dimensions ?? []).map(({ key, options }) => [
			key,
			overrides[key] ?? options[0]!.value
		])
	);
}

// A dimension option may carry its own title ("30-Day Retention"), which replaces
// the stat's; anything else selected trails it in parentheses.
function resolveTitle(stat: StatDefinition, selection: Record<string, string>) {
	if (!stat.dimensions) return stat.title;

	const chosen = stat.dimensions
		.map(({ key, options }) => options.find(({ value }) => value === selection[key]))
		.filter((option) => option !== undefined);

	const base = chosen.find(({ title }) => title)?.title ?? stat.title;
	const rest = chosen
		.filter(({ title }) => !title)
		.map(({ description, label }) => description ?? label);

	return rest.length > 0 ? `${base} (${rest.join(" · ")})` : base;
}

const StatChart: FC<{
	stat: StatDefinition;
	name: string;
	title: string;
}> = ({ stat, name, title }) => {
	const data = useQuery({
		queryKey: statSeriesKey(name),
		queryFn: ({ queryKey: [, name], signal }) => Stats.get(name, { signal })
	});

	return (
		<Chart
			band={stat.chart === "band"}
			columns={data.columns}
			format={stat.format}
			rows={data.rows}
			series={stat.series}
			title={title}
			x={stat.x}
		/>
	);
};

const StatsContent: FC = () => {
	const toasts = useToast();

	const index = useQuery({
		queryKey: statsIndexKey(),
		queryFn: ({ signal }) => Stats.index({ signal })
	});

	const [selectedKey, setSelectedKey] = useState(index.stats[0]?.key ?? "dau");
	const [overrides, setOverrides] = useState<Record<string, string>>({});

	const selected = index.stats.find(({ key }) => key === selectedKey) ?? index.stats[0];
	const selection = useMemo(
		() => (selected ? resolveSelection(selected, overrides) : {}),
		[selected, overrides]
	);

	// Deferred as one object so the heading and axis format never describe a
	// series that hasn't loaded yet.
	const descriptor = useMemo(() => selected && ({
		stat: selected,
		name: statName(selected, selection),
		title: resolveTitle(selected, selection)
	}), [selected, selection]);

	const deferred = useDeferredValue(descriptor);
	const stale = deferred !== descriptor;

	async function download(stat: StatDefinition) {
		try {
			await Stats.download(statName(stat, resolveSelection(stat, overrides)));
		}
		catch {
			toasts.add(`Couldn't download ${stat.label}`);
		}
	}

	return (
		<div className="flex flex-col gap-6 desktop:flex-row desktop:gap-8">
			<nav className="flex shrink-0 flex-col gap-1 desktop:w-52">
				{index.stats.map((stat) => (
					<div
						key={stat.key}
						className={twMerge(
							"focusable-within flex items-center rounded-lg",
							stat.key === selectedKey
								? "bg-brand-gradient text-white-20"
								: "hover:bg-white-30 dark:hover:bg-black-60"
						)}
					>
						<button
							className="grow rounded-l-lg px-3 py-2 text-left font-nunito outline-none"
							type="button"
							onClick={() => setSelectedKey(stat.key)}
						>
							{stat.label}
						</button>
						<button
							aria-label={`Download ${stat.label} CSV`}
							className="rounded-r-lg px-3 py-2 opacity-70 outline-none hover:opacity-100"
							type="button"
							onClick={() => download(stat)}
						>
							<Download className="size-4" />
						</button>
					</div>
				))}
			</nav>
			<div className="flex min-w-0 grow flex-col gap-4">
				<div className={twMerge("transition-opacity", stale && "opacity-60")}>
					<Suspense fallback={<div className="h-[344px]" />}>
						{deferred && (
							<StatChart
								name={deferred.name}
								stat={deferred.stat}
								title={deferred.title}
							/>
						)}
					</Suspense>
				</div>
				{selected?.dimensions && (
					<div className="grid grid-cols-2 gap-4">
						{selected.dimensions.map(({ key, label, options }) => (
							<div key={key} className="flex flex-col gap-1">
								<span className="font-montserrat text-sm font-semibold">{label}</span>
								<InputSelect
									options={options.map(({ value, label }) => ({ id: value, name: label }))}
									value={selection[key] ?? ""}
									onChange={(value) => setOverrides((current) => ({
										...current,
										[key]: value as string
									}))}
								/>
							</div>
						))}
					</div>
				)}
				<span className="text-sm text-black-30 dark:text-white-50">
					Updated
					{" "}
					{index.updatedAt}
				</span>
			</div>
		</div>
	);
};

export const StatsView: FC = () => (
	<ModelCard
		data-block
		className="desktop:max-w-5xl"
		containerProps={{ className: "gap-8" }}
		title="Stats"
	>
		<Suspense fallback={<span className="brightness-75">Loading...</span>}>
			<StatsContent />
		</Suspense>
	</ModelCard>
);
