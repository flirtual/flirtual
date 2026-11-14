import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, Search, TrendingUp } from "lucide-react";
import ms from "ms" with { type: "macro" };
import type { FC, ReactNode, RefCallback } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { KlipyFile, KlipyGif, KlipyOptions, KlipySource } from "~/api/klipy";
import { klipyCategories, klipyCustomerId, klipyGifs, klipyPreviewFile } from "~/api/klipy";
import { useDevice } from "~/hooks/use-device";
import { useLocale } from "~/i18n";
import { queryClient } from "~/query";

const columnWidth = 160;
const pinnedQueries = ["vrchat", "cats"];

// Inner ring, or else the scroll area clips it.
const tile = "relative overflow-hidden rounded-lg outline-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-theme-1 after:ring-inset focus-visible:after:ring-2";

type Browse = "home" | "recent" | "trending";

interface Klipy {
	/** What the options depend on, for query keys. */
	key: ReadonlyArray<string | undefined>;
	options: () => Promise<KlipyOptions>;
}

function sourceKey(source: KlipySource) {
	return source.kind === "search" ? `search:${source.query}` : source.kind;
}

// Defers a tile's request until it scrolls near the picker's viewport.
function useSeen(): [RefCallback<HTMLElement>, boolean] {
	const [seen, setSeen] = useState(false);
	const reference = useCallback((element: HTMLElement | null) => {
		if (!element || seen) return;

		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) setSeen(true);
		}, { rootMargin: "100px" });

		observer.observe(element);
		return () => observer.disconnect();
	}, [seen]);

	return [reference, seen];
}

const Tile: FC<{
	label: ReactNode;
	preview?: string;
	ref?: RefCallback<HTMLElement>;
	onClick: () => void;
}> = ({ label, preview, ref, onClick }) => (
	<button
		className={`${tile} h-24 bg-black-90/10 dark:bg-white-10/10`}
		ref={ref}
		type="button"
		onClick={onClick}
	>
		{preview && (
			<img
				alt=""
				className="absolute inset-0 size-full object-cover"
				decoding="async"
				draggable={false}
				loading="lazy"
				referrerPolicy="no-referrer"
				src={preview}
			/>
		)}
		<span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black-90/50 px-2 text-center font-montserrat font-semibold! text-white-10! [text-shadow:0_1px_3px_rgb(0_0_0/0.6)] [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:fill-none!">
			{label}
		</span>
	</button>
);

// The first GIF a source returns stands in for it, as Klipy's own categories do.
const SourceTile: FC<{
	source: KlipySource;
	label: ReactNode;
	klipy: Klipy;
	onClick: () => void;
}> = ({ source, label, klipy, onClick }) => {
	const [reference, seen] = useSeen();
	const { data } = useQuery({
		queryKey: ["klipy", "preview", sourceKey(source), ...klipy.key],
		// Search returns no fewer than 8.
		queryFn: async ({ signal }) => klipyGifs(source, 1, source.kind === "search" ? 8 : 1, await klipy.options(), signal),
		enabled: seen,
		staleTime: ms("10m"),
		gcTime: ms("10m"),
		retry: false,
		throwOnError: false
	}, queryClient);

	const first = data?.data[0];
	return <Tile label={label} preview={first && klipyPreviewFile(first)?.url} ref={reference} onClick={onClick} />;
};

const GifHome: FC<{
	queries: ReadonlyArray<string>;
	klipy: Klipy;
	onBrowse: (browse: Exclude<Browse, "home">) => void;
	onSearch: (query: string) => void;
}> = ({ queries, klipy, onBrowse, onSearch }) => {
	const { t } = useTranslation();
	const { data: categories = [] } = useQuery({
		queryKey: ["klipy", "categories", ...klipy.key],
		queryFn: async ({ signal }) => klipyCategories(await klipy.options(), signal),
		staleTime: ms("1h"),
		gcTime: ms("1h"),
		retry: 1,
		throwOnError: false
	}, queryClient);

	// Klipy's categories all show, as its terms require: our own tiles give way to ones they repeat.
	const categoryQueries = new Set(categories.map(({ query }) => query));
	const searches = [...new Set([...pinnedQueries, ...queries])].filter((query) => !categoryQueries.has(query));

	return (
		<div className="grid grid-cols-2 gap-1.5">
			<SourceTile
				label={(
					<>
						<History />
						{t("recent")}
					</>
				)}
				klipy={klipy}
				source={{ kind: "recent" }}
				onClick={() => onBrowse("recent")}
			/>
			<SourceTile
				label={(
					<>
						<TrendingUp />
						{t("trending")}
					</>
				)}
				klipy={klipy}
				source={{ kind: "trending" }}
				onClick={() => onBrowse("trending")}
			/>
			{searches.map((query) => (
				<SourceTile
					key={query}
					klipy={klipy}
					label={query}
					source={{ kind: "search", query }}
					onClick={() => onSearch(query)}
				/>
			))}
			{categories.map(({ category, query, preview_url }) => (
				<Tile key={query} label={category} preview={preview_url} onClick={() => onSearch(query)} />
			))}
		</div>
	);
};

// Results stay in the order and composition Klipy returns them, as its terms require: each GIF in
// turn goes to the shortest column, at its own aspect ratio, with nothing cropped out or skipped.
const GifResults: FC<{
	source: KlipySource;
	klipy: Klipy;
	onPick: (gif: KlipyGif) => void;
}> = ({ source, klipy, onPick }) => {
	const { t } = useTranslation();
	const sentinel = useRef<HTMLDivElement>(null);

	const { data, status, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
		queryKey: ["klipy", "gifs", sourceKey(source), ...klipy.key],
		queryFn: async ({ pageParam, signal }) => klipyGifs(source, pageParam, 24, await klipy.options(), signal),
		initialPageParam: 1,
		getNextPageParam: (page) => page.has_next ? page.current_page + 1 : undefined,
		staleTime: ms("10m"),
		gcTime: ms("10m"),
		retry: 1,
		throwOnError: false
	}, queryClient);

	useEffect(() => {
		const element = sentinel.current;
		if (!element || !hasNextPage) return;

		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
		}, { rootMargin: "200px" });

		observer.observe(element);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const [width, setWidth] = useState(0);
	const measure = useCallback((element: HTMLDivElement | null) => {
		if (!element) return;

		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const columns = Array.from({ length: Math.max(2, Math.floor(width / columnWidth)) }, () => ({
		height: 0,
		items: [] as Array<{ gif: KlipyGif; preview: KlipyFile; ratio: number }>
	}));

	for (const gif of data?.pages.flatMap((page) => page.data) ?? []) {
		// A result with no image at all has nothing to show; one without dimensions shows square.
		const preview = klipyPreviewFile(gif);
		if (!preview) continue;
		const ratio = preview.width && preview.height ? preview.height / preview.width : 1;

		const column = columns.reduce((shortest, column) => column.height < shortest.height ? column : shortest);
		column.items.push({ gif, preview, ratio });
		column.height += ratio;
	}

	return (
		<>
			{status === "success" && columns.every(({ items }) => items.length === 0) && (
				<p className="py-8 text-center opacity-75">{t("no_results")}</p>
			)}
			{status === "error" && (
				<p className="py-8 text-center opacity-75">{t("errors.internal_server_error")}</p>
			)}

			<div className="flex items-start gap-1" ref={measure}>
				{columns.map(({ items }, index) => (
					// Columns have no identity beyond their position.
					// eslint-disable-next-line react/no-array-index-key
					<div key={index} className="flex min-w-0 flex-1 flex-col gap-1">
						{items.map(({ gif, preview, ratio }) => (
							<button
								key={gif.id}
								aria-label={gif.title}
								className={`${tile} w-full bg-black-90/5 dark:bg-white-10/5`}
								style={{ aspectRatio: `1 / ${ratio}` }}
								title={gif.title}
								type="button"
								onClick={() => onPick(gif)}
							>
								<img
									alt=""
									className="size-full"
									decoding="async"
									draggable={false}
									loading="lazy"
									referrerPolicy="no-referrer"
									src={preview.url}
									style={gif.blur_preview ? { backgroundImage: `url("${gif.blur_preview}")`, backgroundSize: "cover" } : undefined}
								/>
							</button>
						))}
					</div>
				))}
			</div>
			<div className="h-px" ref={sentinel} />
		</>
	);
};

export const GifPicker: FC<{
	/** Hashed into Klipy's customer id. */
	userId: string;
	/** The person's own country, for regional results. */
	country?: string;
	/** Searches suggested by interests both people share. */
	queries: ReadonlyArray<string>;
	onPick: (gif: KlipyGif, query: string) => void;
}> = ({ userId, country, queries, onPick }) => {
	const { t } = useTranslation();
	const { native } = useDevice();
	const [locale] = useLocale();
	const [input, setInput] = useState("");
	const [query, setQuery] = useState("");
	const [browse, setBrowse] = useState<Browse>("home");
	const scroller = useRef<HTMLDivElement>(null);
	const homeScroll = useRef(0);

	useEffect(() => {
		const timeout = setTimeout(() => setQuery(input.trim()), 300);
		return () => clearTimeout(timeout);
	}, [input]);

	const language = locale.split("-")[0];
	const klipy: Klipy = {
		key: [userId, language, country],
		options: async () => ({ customerId: await klipyCustomerId(userId), language, country })
	};

	const source: KlipySource | null = query
		? { kind: "search", query }
		: browse === "home" ? null : { kind: browse };

	// The home grid and every list share one scroller: a list starts at the top, and going back
	// returns to wherever the grid was left.
	const view = source ? sourceKey(source) : "home";
	useLayoutEffect(() => {
		if (scroller.current) scroller.current.scrollTop = view === "home" ? homeScroll.current : 0;
	}, [view]);

	const search = (value: string) => {
		setInput(value);
		setQuery(value);
	};

	const home = () => {
		search("");
		setBrowse("home");
	};

	return (
		<div className="flex size-full flex-col gap-3 p-2.5 pb-0">
			<div className="flex h-10 shrink-0 items-center gap-1">
				{source && (
					<button
						aria-label={t("back")}
						className="flex size-10 shrink-0 items-center justify-center rounded-full opacity-75 focusable hocus:opacity-100 [&>svg]:size-5 [&>svg]:fill-none!"
						title={t("back")}
						type="button"
						onClick={home}
					>
						<ArrowLeft />
					</button>
				)}
				<label className="flex h-full grow items-center gap-2 rounded-xl bg-white-40 px-3 text-black-80 shadow-brand-1 focusable-within dark:bg-black-60 dark:text-white-20 vision:bg-white-40/70">
					<Search className="size-5 shrink-0 fill-none! opacity-75" />
					<input
						aria-label={t("search_klipy")}
						// The keyboard would cover the results on a phone.
						autoFocus={!native}
						className="w-full border-none bg-transparent p-0 placeholder:text-black-50 focus:ring-0 focus:outline-hidden dark:placeholder:text-white-50"
						enterKeyHint="search"
						placeholder={source && source.kind !== "search" ? t(source.kind) : t("search_klipy")}
						type="search"
						value={input}
						onChange={(event) => setInput(event.target.value)}
					/>
				</label>
			</div>

			<div
				className="min-h-0 grow overflow-y-auto overscroll-contain pb-2.5"
				ref={scroller}
				onScroll={(event) => {
					if (!source) homeScroll.current = event.currentTarget.scrollTop;
				}}
			>
				{source
					? (
							<GifResults
								key={sourceKey(source)}
								klipy={klipy}
								source={source}
								onPick={(gif) => onPick(gif, query)}
							/>
						)
					: <GifHome klipy={klipy} queries={queries} onBrowse={setBrowse} onSearch={search} />}
			</div>
		</div>
	);
};
