import { useCallback, useEffect, useMemo, useState } from "react";
import type { FC } from "react";

import type { StatFormat, StatRow, StatSeries } from "~/api/stats";

const padding = { top: 16, right: 72, bottom: 28, left: 56 };
const height = 300;
const tickTarget = 5;

// --chart-1..5, defined per mode in index.css.
const slots = [1, 2, 3, 4, 5];

function formatValue(value: number, format: StatFormat) {
	return format === "percent"
		? `${(value * 100).toFixed(1)}%`
		: value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Round the tick step to 1, 2, 5 or 10 × a power of ten and derive the ceiling
// from it. Rounding the ceiling instead leaves steps like 12.5 that render as
// "13" next to gridlines drawn at 12.5.
function niceScale(maximum: number) {
	if (maximum <= 0) return { ceiling: 1, step: 1 };

	const rough = maximum / tickTarget;
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const normalized = rough / magnitude;
	const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;

	return { ceiling: Math.ceil(maximum / step) * step, step };
}

function readValue(row: StatRow, index: number) {
	const value = row[index];
	return typeof value === "number" ? value : null;
}

export const Chart: FC<{
	title: string;
	format: StatFormat;
	series: Array<StatSeries>;
	columns: Array<string>;
	rows: Array<StatRow>;
	x: string;
	band: boolean;
}> = ({ title, format, series, columns, rows, x, band }) => {
	const xIndex = columns.indexOf(x);
	const indices = useMemo(
		() => series.map(({ key }) => columns.indexOf(key)),
		[series, columns]
	);

	const [element, setElement] = useState<HTMLDivElement | null>(null);
	const [width, setWidth] = useState(720);
	const [active, setActive] = useState<number | null>(null);

	useEffect(() => {
		if (!element) return;

		const update = () => setWidth(element.clientWidth);
		update();

		const observer = new ResizeObserver(update);
		observer.observe(element);

		return () => observer.disconnect();
	}, [element]);

	const chart = useMemo(() => {
		// A row with no value on the chosen axis cannot be placed; rows predating a
		// stat gaining cohort_date are the usual reason.
		const plotted = rows.filter((row) => typeof row[xIndex] === "string");

		const values = plotted.flatMap((row) =>
			indices.map((index) => readValue(row, index)).filter((value): value is number => value !== null));

		if (plotted.length === 0 || values.length === 0) return null;

		const times = plotted.map((row) => Date.parse(row[xIndex] as string));
		const [minimum, maximum] = [Math.min(...times), Math.max(...times)];
		const { ceiling, step } = niceScale(Math.max(...values));

		const innerWidth = Math.max(width - padding.left - padding.right, 1);
		const innerHeight = height - padding.top - padding.bottom;

		const scaleX = (time: number) => padding.left
			+ (maximum === minimum ? innerWidth / 2 : ((time - minimum) / (maximum - minimum)) * innerWidth);
		const scaleY = (value: number) => padding.top + innerHeight - (value / ceiling) * innerHeight;

		// A null value is a day the stat was never recorded; break the line there
		// rather than drawing straight through the gap.
		const lineFor = (index: number) => {
			const segments: Array<Array<{ x: number; y: number }>> = [];
			let segment: Array<{ x: number; y: number }> = [];

			plotted.forEach((row, position) => {
				const value = readValue(row, index);

				if (value === null) {
					if (segment.length > 0) segments.push(segment);
					segment = [];
					return;
				}

				segment.push({ x: scaleX(times[position]!), y: scaleY(value) });
			});
			if (segment.length > 0) segments.push(segment);

			const lastIndex = plotted.findLastIndex((row) => readValue(row, index) !== null);

			return {
				segments,
				end: lastIndex === -1
					? null
					: {
							x: scaleX(times[lastIndex]!),
							y: scaleY(readValue(plotted[lastIndex]!, index)!),
							value: readValue(plotted[lastIndex]!, index)!
						}
			};
		};

		// The band is drawn from the outer quartiles, with the median as its line.
		const bandArea = band
			? plotted.flatMap((row, position) => {
					const low = readValue(row, indices[0]!);
					const high = readValue(row, indices[2]!);
					return low === null || high === null
						? []
						: [{ x: scaleX(times[position]!), low: scaleY(low), high: scaleY(high) }];
				})
			: [];

		return {
			plotted,
			scaleY,
			lines: (band ? [series[1]!] : series).map((entry, position) => {
				const index = band ? indices[1]! : indices[position]!;
				return { ...entry, index, slot: slots[position % slots.length]!, ...lineFor(index) };
			}),
			band: bandArea.length > 1
				? `${bandArea.map(({ x, high }) => `${x},${high}`).join(" ")} ${bandArea
					.slice()
					.reverse()
					.map(({ x, low }) => `${x},${low}`)
					.join(" ")}`
				: null,
			positions: plotted.map((_, index) => scaleX(times[index]!)),
			ticks: Array.from({ length: Math.round(ceiling / step) + 1 }, (_, index) => {
				const value = step * index;
				return { value, y: scaleY(value) };
			}),
			// Sampled positions collapse onto each other when there are few rows, so
			// they are de-duplicated: four identical labels would stack, and sharing
			// a React key leaves orphaned nodes behind on the next render.
			dates: Array.from({ length: 4 }, (_, index) =>
				Math.round((index / 3) * (plotted.length - 1)))
				.filter((position, index, all) => all.indexOf(position) === index)
				.map((position) => ({
					position,
					label: (plotted[position]![xIndex] as string).slice(0, 7),
					x: scaleX(times[position]!)
				}))
		};
	}, [rows, xIndex, indices, width, series, band]);

	const onPointer = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
		if (!chart) return;

		const bounds = event.currentTarget.getBoundingClientRect();
		const offset = event.clientX - bounds.left;

		let nearest = 0;
		let distance = Number.POSITIVE_INFINITY;

		chart.positions.forEach((position, index) => {
			const candidate = Math.abs(position - offset);
			if (candidate < distance) {
				distance = candidate;
				nearest = index;
			}
		});

		setActive(nearest);
	}, [chart]);

	const onKeyDown = useCallback((event: React.KeyboardEvent) => {
		if (!chart) return;

		const delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
		if (delta === 0) return;

		event.preventDefault();
		setActive((current) => Math.min(
			Math.max((current ?? chart.plotted.length - 1) + delta, 0),
			chart.plotted.length - 1
		));
	}, [chart]);

	const activePoint = active === null ? null : chart?.plotted[active];

	// Direct labels ride the lines only while they stay legible; past four series,
	// or where two ends land on top of each other, the legend carries identity.
	const endLabels = useMemo(() => {
		if (!chart || chart.lines.length > 4) return [];

		const placed: Array<number> = [];

		return chart.lines
			.filter((line) => line.end !== null)
			.sort((a, b) => a.end!.y - b.end!.y)
			.filter((line) => {
				if (placed.some((y) => Math.abs(y - line.end!.y) < 12)) return false;
				placed.push(line.end!.y);
				return true;
			});
	}, [chart]);

	return (
		<figure className="flex w-full flex-col gap-2">
			<figcaption className="font-montserrat text-sm font-semibold">
				{title}
				{band && (
					<span className="ml-2 font-nunito text-xs font-normal text-black-30 dark:text-white-50">
						median, shaded 25–75%
					</span>
				)}
			</figcaption>
			<div className="relative w-full" ref={setElement}>
				{chart
					? (
							<>
								<svg
									aria-label={`${title}. ${chart.plotted.length} points. Use the table below for exact figures.`}
									className="focusable w-full touch-none"
									height={height}
									role="img"
									tabIndex={0}
									width={width}
									onKeyDown={onKeyDown}
									onPointerLeave={() => setActive(null)}
									onPointerMove={onPointer}
								>
									{chart.ticks.map(({ value, y }) => (
										<g key={value}>
											<line
												className="stroke-black-60/15 dark:stroke-white-50/15"
												strokeWidth={1}
												x1={padding.left}
												x2={width - padding.right}
												y1={y}
												y2={y}
											/>
											<text
												className="fill-black-40 text-[11px] tabular-nums dark:fill-white-50"
												dominantBaseline="middle"
												textAnchor="end"
												x={padding.left - 8}
												y={y}
											>
												{formatValue(value, format)}
											</text>
										</g>
									))}
									{chart.dates.map(({ label, position, x: offset }) => (
										<text
											key={position}
											className="fill-black-40 text-[11px] tabular-nums dark:fill-white-50"
											textAnchor="middle"
											x={offset}
											y={height - 8}
										>
											{label}
										</text>
									))}
									{chart.band && (
										<polygon fill="var(--chart-1)" fillOpacity={0.14} points={chart.band} />
									)}
									{chart.lines.flatMap((line) => line.segments.map((segment) => (segment.length === 1
										? (
												<circle
													key={`${line.key}-${segment[0]!.x}`}
													cx={segment[0]!.x}
													cy={segment[0]!.y}
													fill={`var(--chart-${line.slot})`}
													r={3}
												/>
											)
										: (
												<polyline
													key={`${line.key}-${segment[0]!.x}`}
													fill="none"
													points={segment.map(({ x: px, y: py }) => `${px},${py}`).join(" ")}
													stroke={`var(--chart-${line.slot})`}
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
												/>
											))))}
									{active !== null && chart.positions[active] !== undefined && (
										<line
											className="stroke-black-60/30 dark:stroke-white-50/30"
											strokeWidth={1}
											x1={chart.positions[active]}
											x2={chart.positions[active]}
											y1={padding.top}
											y2={height - padding.bottom}
										/>
									)}
									{active !== null && chart.lines.map((line) => {
										const value = readValue(chart.plotted[active]!, line.index);
										if (value === null) return null;

										return (
											<circle
												key={line.key}
												className="stroke-white-20 dark:stroke-black-70"
												cx={chart.positions[active]}
												cy={chart.scaleY(value)}
												fill={`var(--chart-${line.slot})`}
												r={4}
												strokeWidth={2}
											/>
										);
									})}
									{endLabels.map((line) => (
										<text
											key={line.key}
											className="fill-black-70 text-[11px] font-semibold tabular-nums dark:fill-white-20"
											dominantBaseline="middle"
											x={line.end!.x + 10}
											y={line.end!.y}
										>
											{formatValue(line.end!.value, format)}
										</text>
									))}
								</svg>
								{activePoint && (
									<div
										style={{
											left: Math.min(
												Math.max((chart.positions[active!] ?? 0) - 70, 0),
												Math.max(width - 140, 0)
											)
										}}
										className="pointer-events-none absolute top-0 z-10 rounded-lg bg-white-10 px-3 py-2 shadow-brand-1 dark:bg-black-80"
									>
										<div className="font-nunito text-xs tabular-nums text-black-30 dark:text-white-50">
											{activePoint[xIndex] as string}
										</div>
										{chart.lines.map((line) => {
											const value = readValue(activePoint, line.index);

											return (
												<div key={line.key} className="flex items-center gap-2 whitespace-nowrap">
													<span
														className="h-0.5 w-3 shrink-0 rounded-full"
														style={{ background: `var(--chart-${line.slot})` }}
													/>
													<span className="font-nunito text-sm font-semibold tabular-nums">
														{value === null ? "No data" : formatValue(value, format)}
													</span>
													{chart.lines.length > 1 && (
														<span className="font-nunito text-xs text-black-30 dark:text-white-50">
															{line.label}
														</span>
													)}
												</div>
											);
										})}
									</div>
								)}
							</>
						)
					: (
							<div className="flex items-center justify-center text-black-30 dark:text-white-50" style={{ height }}>
								No data recorded yet.
							</div>
						)}
			</div>
			{chart && chart.lines.length > 1 && (
				<div className="flex flex-wrap gap-x-4 gap-y-1">
					{chart.lines.map((line) => (
						<span key={line.key} className="flex items-center gap-1.5 text-xs">
							<span
								className="h-0.5 w-3 rounded-full"
								style={{ background: `var(--chart-${line.slot})` }}
							/>
							{line.label}
						</span>
					))}
				</div>
			)}
			<details className="select-children mt-1">
				<summary className="cursor-pointer text-sm text-black-30 dark:text-white-50">
					Table view
				</summary>
				<div className="mt-2 max-h-64 overflow-auto">
					<table className="w-full text-left text-sm tabular-nums">
						<thead className="sticky top-0 bg-white-20 dark:bg-black-70">
							<tr>
								<th className="py-1 pr-4 font-montserrat font-semibold">{x === "cohort_date" ? "Cohort" : "Date"}</th>
								{series.map(({ key, label }) => (
									<th key={key} className="py-1 pr-4 font-montserrat font-semibold">{label}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row[0] as string}>
									<td className="py-1 pr-4">{(row[xIndex] as string) ?? "—"}</td>
									{series.map(({ key }, position) => {
										const value = readValue(row, indices[position]!);
										return (
											<td key={key} className="py-1 pr-4">
												{value === null ? "—" : formatValue(value, format)}
											</td>
										);
									})}
								</tr>
							)).reverse()}
						</tbody>
					</table>
				</div>
			</details>
		</figure>
	);
};
