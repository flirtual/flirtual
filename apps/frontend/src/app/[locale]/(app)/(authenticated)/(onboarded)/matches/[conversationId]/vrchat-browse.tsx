import { ChevronLeft, ChevronRight, Cone, Dices, Flame, Gamepad2, Loader2, Sprout } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { User } from "~/api/user";
import { VRChat } from "~/api/vrchat";
import type { VRChatCategory, VRChatWorld } from "~/api/vrchat";
import { Button } from "~/components/button";
import { InputText } from "~/components/inputs";
import { useToast } from "~/hooks/use-toast";

export interface VRChatBrowseProps {
	user: User;
	conversationId: string;
	onClose: () => void;
}

interface CategoryState {
	worlds: Array<VRChatWorld>;
	page: number;
	hasMore: boolean;
	loading: boolean;
}

export const VRChatBrowse: FC<VRChatBrowseProps> = (props) => {
	const { user, conversationId, onClose } = props;
	const [categories, setCategories] = useState<Record<string, VRChatCategory> | null>(null);
	const [categoryStates, setCategoryStates] = useState<Record<string, CategoryState>>({});
	const [searchWorlds, setSearchWorlds] = useState<Array<VRChatWorld>>([]);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [searchMode, setSearchMode] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const observerReference = useRef<HTMLDivElement>(null);
	const loadingCategoriesReference = useRef<Set<string>>(new Set());

	const toast = useToast();

	// Global function for DOM-created invite buttons
	useEffect(() => {
		(window as any).inviteToWorld = async (worldId: string) => {
			try {
				await VRChat.createInstance(worldId, conversationId);
				toast.add({ type: "success", value: "Invite sent!" });
				onClose();
			}
			catch (reason) {
				console.error("Failed to send invite:", reason);
				toast.add({ type: "error", value: "Failed to send invite. Please try again later." });
			}
		};

		return () => {
			delete (window as any).inviteToWorld;
		};
	}, [conversationId, onClose, toast]);

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 1000);

		return () => clearTimeout(timer);
	}, [search]);

	const loadCategorizedWorlds = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await VRChat.getCategorizedWorlds();
			setCategories(response.categories);

			// Initialize category states
			const initialStates: Record<string, CategoryState> = {};
			Object.entries(response.categories).forEach(([key, category]) => {
				initialStates[key] = {
					worlds: category.worlds,
					page: 0,
					hasMore: category.hasMore,
					loading: false
				};
			});
			setCategoryStates(initialStates);
		}
		catch (reason) {
			console.error("Failed to load categorized worlds:", reason);
			const errorMessage = "Failed to load VRChat worlds. Please try again later.";
			setError(errorMessage);
			toast.add({ type: "error", value: errorMessage });
		}
		finally {
			setLoading(false);
		}
	}, [toast]);

	const loadMoreCategoryWorlds = useCallback(async (categoryKey: string): Promise<void> => {
		const currentState = categoryStates[categoryKey];
		if (!currentState || !currentState.hasMore) return Promise.resolve();

		// Prevent concurrent loads for the same category
		if (loadingCategoriesReference.current.has(categoryKey)) {
			return Promise.resolve();
		}

		loadingCategoriesReference.current.add(categoryKey);

		setCategoryStates((previous) => ({
			...previous,
			[categoryKey]: { ...previous[categoryKey], loading: true }
		}));

		try {
			const nextPage = currentState.page + 1;
			const response = await VRChat.getCategoryWorlds(categoryKey, nextPage);

			setCategoryStates((previous) => ({
				...previous,
				[categoryKey]: {
					...previous[categoryKey],
					worlds: [...previous[categoryKey].worlds, ...response.worlds],
					page: nextPage,
					hasMore: response.hasMore,
					loading: false
				}
			}));
		}
		catch (reason) {
			console.error(`Failed to load more ${categoryKey} worlds:`, reason);
			setCategoryStates((previous) => ({
				...previous,
				[categoryKey]: { ...previous[categoryKey], loading: false }
			}));
		}
		finally {
			loadingCategoriesReference.current.delete(categoryKey);
		}
	}, [categoryStates]);

	const performSearch = useCallback(async (searchTerm: string, pageNumber = 0, reset = true) => {
		if (!searchTerm.trim() || error) return;

		if (reset) {
			setLoading(true);
			setSearchWorlds([]); // Clear worlds immediately when starting new search
		}
		else {
			setLoadingMore(true);
		}
		setError(null);
		try {
			const response = await VRChat.searchWorlds(searchTerm, pageNumber);
			setSearchWorlds((previous) => reset ? response.worlds : [...previous, ...response.worlds]);
			setHasMore(response.hasMore);
			setPage(pageNumber);
		}
		catch (reason) {
			console.error("Failed to search worlds:", reason);
			const errorMessage = "Failed to search VRChat worlds. Please try again later.";
			setError(errorMessage);
			toast.add({ type: "error", value: errorMessage });
			setHasMore(false); // Prevent further attempts
		}
		finally {
			setLoading(false);
			setLoadingMore(false);
		}
	}, [toast, error]);

	const handleSearch = useCallback((searchTerm: string) => {
		setSearch(searchTerm);
		setError(null); // Clear previous errors when starting a new search
	}, []);

	// Effect to handle debounced search
	useEffect(() => {
		if (debouncedSearch.trim()) {
			setSearchMode(true);
			performSearch(debouncedSearch, 0, true);
		}
		else {
			setSearchMode(false);
			setSearchWorlds([]);
			setHasMore(true);
			setPage(0);
		}
	}, [debouncedSearch, performSearch]);

	const handleLoadMore = useCallback(() => {
		if (loading || loadingMore || !hasMore || error || !searchMode) return;

		const nextPage = page + 1;
		if (debouncedSearch.trim()) {
			performSearch(debouncedSearch, nextPage, false);
		}
	}, [loading, loadingMore, hasMore, page, searchMode, debouncedSearch, performSearch, error]);

	// Intersection observer for infinite scroll (only for search)
	useEffect(() => {
		if (!searchMode) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && hasMore && !loading && !loadingMore && !error) {
					handleLoadMore();
				}
			},
			{ threshold: 0.1 }
		);

		if (observerReference.current) {
			observer.observe(observerReference.current);
		}

		return () => {
			if (observerReference.current) {
				observer.unobserve(observerReference.current);
			}
		};
	}, [searchMode, handleLoadMore, hasMore, loading, loadingMore, error]);

	const handleInvite = useCallback(async (world: VRChatWorld) => {
		setLoading(true);
		try {
			// Create VRChat instance and send message from backend
			const instance = await VRChat.createInstance(world.id, conversationId);

			toast.add({ type: "success", value: "Invite sent!" });
			onClose();
		}
		catch (reason) {
			console.error("Failed to send invite:", reason);
			toast.add({ type: "error", value: "Failed to send invite. Please try again later." });
		}
		finally {
			setLoading(false);
		}
	}, [conversationId, onClose, toast]);

	// Load initial categorized worlds
	useEffect(() => {
		loadCategorizedWorlds();
	}, [loadCategorizedWorlds]);

	const scrollCategory = useCallback((categoryKey: string, direction: "left" | "right") => {
		const container = document.getElementById(`worlds-${categoryKey}`);
		if (!container) return;

		const scrollAmount = 320; // Approximate width of 2 world cards
		const newScrollLeft = direction === "left"
			? container.scrollLeft - scrollAmount
			: container.scrollLeft + scrollAmount;

		container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
	}, []);

	const WorldCard: FC<{ world: VRChatWorld }> = ({ world }) => (
		<div className="flex w-40 flex-shrink-0 flex-col gap-2 rounded-2xl bg-white-20 p-3 shadow-brand-1 dark:bg-black-60">
			<div className="aspect-video overflow-hidden rounded-lg">
				<img
					alt={world.name}
					className="size-full object-cover"
					loading="lazy"
					src={world.thumbnailImageUrl || world.imageUrl}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<h3 className="truncate text-sm font-semibold">{world.name}</h3>
				<p className="truncate text-xs text-black-60 dark:text-white-40">
					by
					{" "}
					{world.authorName}
				</p>
			</div>
			<Button
				className="mt-auto h-8"
				disabled={loading}
				size="xs"
				onClick={() => handleInvite(world)}
			>
				Invite
			</Button>
		</div>
	);

	const CategoryRow: FC<{ categoryKey: string; category: VRChatCategory }> = ({ categoryKey, category }) => {
		const [showLeftArrow, setShowLeftArrow] = useState(false);
		const [showRightArrow, setShowRightArrow] = useState(true);
		const [showLeftShadow, setShowLeftShadow] = useState(false);
		const [showRightShadow, setShowRightShadow] = useState(true);
		const categoryState = categoryStates[categoryKey];
		const scrollReference = useRef<HTMLDivElement>(null);
		const sentinelReference = useRef<HTMLDivElement>(null);
		const worldsContainerReference = useRef<HTMLDivElement>(null);

		// Only show the initial worlds from React, additional ones will be added via DOM
		const initialWorlds = category.worlds;

		const handleScroll = useCallback(() => {
			if (!scrollReference.current) return;

			const { scrollLeft, scrollWidth, clientWidth } = scrollReference.current;

			setShowLeftArrow(scrollLeft > 10);
			setShowLeftShadow(scrollLeft > 10);

			const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10;
			setShowRightArrow(!isAtEnd);
			setShowRightShadow(!isAtEnd);
		}, []);

		// Load more worlds by directly manipulating DOM
		const loadMoreWorlds = useCallback(async () => {
			const currentState = categoryStates[categoryKey];
			if (!currentState || !currentState.hasMore || loadingCategoriesReference.current.has(categoryKey)) return;

			loadingCategoriesReference.current.add(categoryKey);

			try {
				const nextPage = currentState.page + 1;
				const response = await VRChat.getCategoryWorlds(categoryKey, nextPage);

				// Add worlds directly to DOM without React re-render
				if (worldsContainerReference.current) {
					response.worlds.forEach((world) => {
						const worldDiv = document.createElement("div");
						worldDiv.className = "flex w-40 flex-shrink-0 flex-col gap-2 rounded-2xl bg-white-20 p-3 shadow-brand-1 dark:bg-black-60";
						worldDiv.innerHTML = `
							<div class="aspect-video overflow-hidden rounded-lg">
								<img alt="${world.name}" class="size-full object-cover" loading="lazy" src="${world.thumbnailImageUrl || world.imageUrl}" />
							</div>
							<div class="flex flex-col gap-1">
								<h3 class="truncate text-sm font-semibold">${world.name}</h3>
								<p class="truncate text-xs text-black-60 dark:text-white-40">by ${world.authorName}</p>
							</div>
							<button class="mt-auto h-8 rounded-lg bg-brand-gradient px-3 text-xs font-medium text-white transition-opacity hover:opacity-80 focus:opacity-80" onclick="window.inviteToWorld('${world.id}')">
								Invite
							</button>
						`;
						worldsContainerReference.current.appendChild(worldDiv);
					});
				}

				// Update pagination state only
				setCategoryStates((previous) => ({
					...previous,
					[categoryKey]: {
						...previous[categoryKey],
						page: nextPage,
						hasMore: response.hasMore
					}
				}));
			}
			catch (reason) {
				console.error(`Failed to load more ${categoryKey} worlds:`, reason);
			}
			finally {
				loadingCategoriesReference.current.delete(categoryKey);
			}
		}, [categoryKey, categoryStates]);

		// Intersection observer for infinite scroll
		useEffect(() => {
			if (!categoryState?.hasMore || categoryState.loading) return;

			const observer = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;
					if (entry.isIntersecting) {
						loadMoreWorlds();
					}
				},
				{ threshold: 0.1, root: scrollReference.current }
			);

			if (sentinelReference.current) {
				observer.observe(sentinelReference.current);
			}

			return () => {
				if (sentinelReference.current) {
					observer.unobserve(sentinelReference.current);
				}
			};
		}, [categoryKey, categoryState?.hasMore, categoryState?.loading, loadMoreWorlds]);

		useEffect(() => {
			const element = scrollReference.current;
			if (!element) return;

			element.addEventListener("scroll", handleScroll, { passive: true });
			handleScroll();

			return () => element.removeEventListener("scroll", handleScroll);
		}, [handleScroll]);

		const getIcon = () => {
			switch (categoryKey) {
				case "spotlight": return <Cone className="size-5" />;
				case "active": return <Flame className="size-5" />;
				case "games": return <Gamepad2 className="size-5" />;
				case "new": return <Sprout className="size-5" />;
				case "random": return <Dices className="size-5" />;
				default: return null;
			}
		};

		return (
			<div className="flex flex-col gap-1 py-2">
				<h2 className="flex items-center gap-2 px-4 text-xl font-semibold">
					{getIcon()}
					{category.title}
				</h2>
				<div className="relative">
					{/* Left shadow gradient */}
					{showLeftShadow && (
						<div
							style={{
								background: "linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)"
							}}
							className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
						/>
					)}

					{/* Right shadow gradient */}
					{showRightShadow && (
						<div
							style={{
								background: "linear-gradient(to left, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)"
							}}
							className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
						/>
					)}

					{/* Left scroll button */}
					{showLeftArrow && (
						<button
							className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white-20 p-2 opacity-80 shadow-brand-1 transition-opacity hover:opacity-100 dark:bg-black-60"
							type="button"
							onClick={() => scrollCategory(categoryKey, "left")}
						>
							<ChevronLeft className="size-4" />
						</button>
					)}

					{/* Scrollable worlds container */}
					<div
						id={`worlds-${categoryKey}`}
						style={{
							scrollbarWidth: "none",
							msOverflowStyle: "none"
						}}
						className="scrollbar-hide flex gap-4 overflow-x-scroll px-4 py-2"
						ref={scrollReference}
						onScroll={handleScroll}
						onWheel={(e) => {
							// Only handle horizontal scrolling, let vertical pass through
							if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
								e.stopPropagation();
							}
						}}
					>
						{/* Container for worlds - initial ones from React, additional ones from DOM */}
						<div className="flex gap-4" ref={worldsContainerReference}>
							{initialWorlds.map((world) => (
								<WorldCard key={world.id} world={world} />
							))}
						</div>

						{/* Sentinel element for infinite scroll */}
						{categoryState?.hasMore && (
							<div className="w-px flex-shrink-0" ref={sentinelReference} />
						)}
					</div>

					{/* Right scroll button */}
					{showRightArrow && (
						<button
							className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white-20 p-2 opacity-80 shadow-brand-1 transition-opacity hover:opacity-100 dark:bg-black-60"
							type="button"
							onClick={() => scrollCategory(categoryKey, "right")}
						>
							<ChevronRight className="size-4" />
						</button>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Search bar */}
			<InputText
				className="w-full"
				placeholder="Search worlds..."
				value={search}
				onChange={handleSearch}
			/>

			{/* Search mode - show infinite scroll grid */}
			{searchMode && (
				<div className="flex flex-col gap-4">
					{/* Loading spinner for initial search */}
					{loading && searchWorlds.length === 0 && (
						<div className="flex justify-center py-8">
							<Loader2 className="size-8 animate-spin text-black-60 dark:text-white-40" />
						</div>
					)}

					{/* Search results grid */}
					{searchWorlds.length > 0 && (
						<div className="grid grid-cols-2 gap-4 desktop:grid-cols-3">
							{searchWorlds.map((world) => (
								<div key={world.id} className="flex flex-col gap-2 rounded-2xl bg-white-20 p-3 shadow-brand-1 dark:bg-black-60">
									<div className="aspect-video overflow-hidden rounded-lg">
										<img
											alt={world.name}
											className="size-full object-cover"
											loading="lazy"
											src={world.thumbnailImageUrl || world.imageUrl}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<h3 className="truncate text-sm font-semibold">{world.name}</h3>
										<p className="text-xs text-black-60 dark:text-white-40">
											by
											{" "}
											{world.authorName}
										</p>
									</div>
									<Button
										className="mt-auto h-9"
										disabled={loading}
										size="sm"
										onClick={() => handleInvite(world)}
									>
										Invite
									</Button>
								</div>
							))}
						</div>
					)}

					{/* Search infinite scroll observer */}
					{hasMore && !error && searchWorlds.length > 0 && (
						<div className="flex justify-center py-4" ref={observerReference}>
							{loadingMore && (
								<Loader2 className="size-6 animate-spin text-black-60 dark:text-white-40" />
							)}
						</div>
					)}

					{/* Search empty state */}
					{searchWorlds.length === 0 && !loading && !error && (
						<div className="flex flex-col items-center gap-2 py-8 text-center">
							<p className="text-black-60 dark:text-white-40">
								No worlds found for your search.
							</p>
						</div>
					)}
				</div>
			)}

			{/* Category mode - show horizontal scrolling rows */}
			{!searchMode && (
				<div className="flex flex-col gap-2">
					{/* Loading spinner for initial load */}
					{loading && !categories && (
						<div className="flex justify-center py-8">
							<Loader2 className="size-8 animate-spin text-black-60 dark:text-white-40" />
						</div>
					)}

					{/* Category rows */}
					{categories && (
						<>
							<CategoryRow category={categories.spotlight} categoryKey="spotlight" />
							<CategoryRow category={categories.active} categoryKey="active" />
							<CategoryRow category={categories.games} categoryKey="games" />
							<CategoryRow category={categories.new} categoryKey="new" />
							<CategoryRow category={categories.random} categoryKey="random" />
						</>
					)}
				</div>
			)}

			{/* Error state */}
			{error && (
				<div className="flex flex-col items-center gap-2 py-8 text-center">
					<p className="text-red-500 dark:text-red-400">
						{error}
					</p>
					<Button
						kind="secondary"
						onClick={() => {
							setError(null);
							if (searchMode && debouncedSearch.trim()) {
								performSearch(debouncedSearch, 0, true);
							}
							else {
								loadCategorizedWorlds();
							}
						}}
					>
						Try Again
					</Button>
				</div>
			)}
		</div>
	);
};
