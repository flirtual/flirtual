import { Slot } from "@radix-ui/react-slot";
import { search as fuzzySearch } from "fast-fuzzy";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FC, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { RemoveScroll } from "react-remove-scroll";
import { twMerge } from "tailwind-merge";

import { Badge } from "~/components/badge";
import { Link } from "~/components/link";
import { Popover, PopoverAnchor, PopoverContent } from "~/components/popover";
import { ScrollIndicator } from "~/components/scroll-indicator";
import { useBreakpoint } from "~/hooks/use-breakpoint";
import { useDisableOutsidePointerEvents } from "~/hooks/use-disable-outside-pointer-events";
import { useSafeArea } from "~/hooks/use-safe-area";
import { useScrollIndicator } from "~/hooks/use-scroll-indicator";
import { urls } from "~/urls";
import { suppressNextClick } from "~/utilities";

export interface AdvancedFilterOption {
	key: string;
	label: string;
}

export interface AdvancedFilterGroup {
	key: string;
	label: string;
	premium: boolean;
	options: Array<AdvancedFilterOption>;
}

interface SuggestionEntry {
	option: AdvancedFilterOption;
	group: AdvancedFilterGroup;
	locked: boolean;
}

export const AdvancedFilterSelect: FC<{
	value: Array<string>;
	onChange: (value: Array<string>) => void;
	groups: Array<AdvancedFilterGroup>;
	premium: boolean;
	limit?: number;
	placeholder?: string;
	id?: string;
}> = ({ value, onChange, groups, premium, limit = 25, placeholder: _placeholder, id }) => {
	const { t } = useTranslation();
	const safeArea = useSafeArea();
	const desktop = useBreakpoint("desktop");
	const [inputValue, setInputValue] = useState("");
	const [overlayVisible, setOverlayVisible] = useState(false);
	const [reservedHeight, setReservedHeight] = useState<number>();
	const rootReference = useRef<HTMLDivElement>(null);
	const anchorReference = useRef<HTMLDivElement>(null);
	const inputReference = useRef<HTMLInputElement>(null);
	const listReference = useRef<HTMLDivElement>(null);
	const { ref: attachList, down: canScrollDown, element: listElement }
		= useScrollIndicator(listReference);

	const fullscreen = overlayVisible && !desktop;

	useDisableOutsidePointerEvents(overlayVisible && desktop);

	// Focusing an input on mobile may scroll the page; we capture and restore the
	// scroll position so opening the fullscreen overlay doesn't shift it.
	const scrollReference = useRef<number | null>(null);
	const previousFullscreen = useRef(false);

	useLayoutEffect(() => {
		if (fullscreen && !previousFullscreen.current)
			scrollReference.current ??= window.scrollY;

		if (!fullscreen && previousFullscreen.current) {
			if (scrollReference.current !== null)
				window.scrollTo({ behavior: "instant", top: scrollReference.current });
			scrollReference.current = null;
		}

		previousFullscreen.current = fullscreen;
	}, [fullscreen]);

	const open = useCallback(() => {
		if (overlayVisible) return;

		// Reserve the space the field vacates so the page below doesn't shift.
		setReservedHeight(rootReference.current?.getBoundingClientRect().height);
		setOverlayVisible(true);
	}, [overlayVisible]);

	const close = useCallback(() => {
		setOverlayVisible(false);
		setInputValue("");
	}, []);

	const filtering = inputValue.trim().length > 0;

	const selectedOptions = useMemo(
		() =>
			value
				.map((key) => {
					for (const group of groups) {
						const option = group.options.find((option) => option.key === key);
						if (option) return option;
					}
					return null;
				})
				.filter((option): option is AdvancedFilterOption => !!option),
		[groups, value]
	);

	// Remaining options grouped with headings; typing flattens them into a filtered
	// list with the category appended to each tag name.
	const visibleGroups = useMemo(
		() =>
			groups
				.map((group) => ({
					group,
					options: group.options.filter(({ key }) => !value.includes(key))
				}))
				.filter(({ options }) => options.length > 0),
		[groups, value]
	);

	const suggestions = useMemo<Array<SuggestionEntry>>(() => {
		if (!filtering) return [];

		const entries = visibleGroups.flatMap(({ group, options }) =>
			options.map((option) => ({
				option,
				group,
				locked: group.premium && !premium
			}))
		);

		return fuzzySearch(inputValue, entries, {
			keySelector: ({ option }) => option.label
		});
	}, [filtering, inputValue, visibleGroups, premium]);

	const add = (key: string, locked: boolean) => {
		if (locked || value.length >= limit || value.includes(key)) return;

		onChange([...value, key]);
		setInputValue("");
		inputReference.current?.focus();
	};

	const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const { key, currentTarget } = event;

		if (!overlayVisible) {
			if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter") {
				open();
				event.preventDefault();
			}

			return;
		}

		if (key === "Escape" && fullscreen) {
			inputReference.current?.blur();
			close();
			return;
		}

		if (key === "Enter" && filtering) {
			const first = suggestions.find(({ locked }) => !locked);
			if (first) add(first.option.key, false);

			event.preventDefault();
			return;
		}

		if (key === "ArrowDown") {
			const first = listReference.current?.querySelector<HTMLButtonElement>(
				"button[data-option]:not(:disabled)"
			);

			first?.focus();
			event.preventDefault();
			return;
		}

		if (key !== "Backspace" || currentTarget.value.length > 0) return;
		event.preventDefault();

		onChange(value.slice(0, -1));
	};

	const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
		event.preventDefault();

		const buttons = [
			...(listReference.current?.querySelectorAll<HTMLButtonElement>(
				"button[data-option]:not(:disabled)"
			) ?? [])
		];

		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);

		if (event.key === "ArrowUp" && index <= 0) {
			inputReference.current?.focus();
			return;
		}

		buttons[index + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
	};

	// The category whose sticky heading is currently pinned at the top, and
	// whether we've scrolled down into it — navigation chevrons are shown on its
	// heading.
	const [active, setActive] = useState({ index: 0, scrolledIn: false });

	const groupElements = () =>
		[...(listReference.current?.querySelectorAll<HTMLElement>("[data-group-heading]") ?? [])]
			.map((heading) => heading.parentElement)
			.filter((group): group is HTMLElement => !!group);

	// Scroll the given category to the top of the (scroll-clipped) list.
	const jumpToGroup = (index: number) => {
		const container = listReference.current;
		const group = groupElements()[index];
		if (!container || !group) return;

		container.scrollTop += group.getBoundingClientRect().top
			- container.getBoundingClientRect().top;
	};

	const onListScroll = useCallback(() => {
		const container = listReference.current;
		if (!container) return;

		const containerTop = container.getBoundingClientRect().top;
		const groups = [...container.querySelectorAll<HTMLElement>("[data-group-heading]")].map(
			(heading) => heading.parentElement
		);

		let index = 0;
		groups.forEach((group, groupIndex) => {
			if (group && group.getBoundingClientRect().top - containerTop <= 1) index = groupIndex;
		});

		const activeGroup = groups[index];
		const scrolledIn = !!activeGroup
			&& activeGroup.getBoundingClientRect().top - containerTop < -4;

		setActive((current) =>
			current.index === index && current.scrolledIn === scrolledIn
				? current
				: { index, scrolledIn });
	}, []);

	const placeholder = selectedOptions.length > 0 ? "" : _placeholder;

	const optionButton = (
		option: AdvancedFilterOption,
		group: AdvancedFilterGroup,
		locked: boolean
	) => (
		<button
			key={option.key}
			className={twMerge(
				"px-4 py-2 text-left focus:outline-none",
				locked
					? "cursor-default opacity-50"
					: "text-black-70 hocus:bg-white-40 dark:text-white-20 dark:hocus:bg-black-80/50"
			)}
			data-option={option.key}
			disabled={locked}
			type="button"
			onClick={() => add(option.key, locked)}
		>
			<span className="font-nunito text-lg">
				{option.label}
				{filtering && (
					<span className="opacity-60">
						{` - ${group.label}`}
					</span>
				)}
			</span>
		</button>
	);

	const optionList = (
		<>
			<RemoveScroll allowPinchZoom as={Slot}>
				<div
					className={twMerge(
						"flex max-h-[var(--overlay-max-height,min(28rem,60svh))] w-full flex-col overflow-y-auto overscroll-contain rounded-xl bg-white-30 shadow-brand-1 focus:outline-none vision:bg-white-30/80 dark:bg-black-60",
						fullscreen && "max-h-none min-h-0 flex-1 rounded-none shadow-none"
					)}
					ref={attachList}
					tabIndex={-1}
					onKeyDown={onListKeyDown}
					onScroll={onListScroll}
				>
					{filtering
						? suggestions.map(({ option, group, locked }) =>
								optionButton(option, group, locked))
						: visibleGroups.map(({ group, options }, index) => {
								const locked = group.premium && !premium;

								return (
									<div
										key={group.key}
										className={twMerge("flex flex-col", index !== 0 && "mt-2")}
									>
										<div
											className="sticky top-0 z-10 flex items-center gap-2 bg-white-30 px-4 pb-2 pt-4 font-nunito text-sm font-bold uppercase text-pink vision:bg-white-30/80 dark:bg-black-60"
											data-group-heading={group.key}
										>
											<span>{group.label}</span>
											{group.premium && (
												<Badge asChild small>
													<Link href={urls.subscription.default}>
														{t("premium")}
													</Link>
												</Badge>
											)}
											{index === Math.min(active.index, visibleGroups.length - 1) && (
												<div className="ml-auto flex items-center gap-1">
													<button
														className="opacity-75 disabled:opacity-30 hocus:opacity-100"
														disabled={index === 0 && !active.scrolledIn}
														tabIndex={-1}
														type="button"
														onClick={() =>
															jumpToGroup(active.scrolledIn ? index : index - 1)}
													>
														<ChevronUp className="size-5" />
													</button>
													<button
														className="opacity-75 disabled:opacity-30 hocus:opacity-100"
														disabled={index === visibleGroups.length - 1}
														tabIndex={-1}
														type="button"
														onClick={() => jumpToGroup(index + 1)}
													>
														<ChevronDown className="size-5" />
													</button>
												</div>
											)}
										</div>
										{options.map((option) => optionButton(option, group, locked))}
									</div>
								);
							})}
				</div>
			</RemoveScroll>
			<ScrollIndicator
				className={twMerge("rounded-b-xl", fullscreen && "rounded-none")}
				itemSelector="[data-option]"
				side="down"
				target={listElement}
				visible={canScrollDown}
			/>
		</>
	);

	return (
		<div
			id={id}
			className="group relative"
			ref={rootReference}
			style={fullscreen ? { height: reservedHeight } : undefined}
			onBlur={({ currentTarget, relatedTarget }) => {
				if (fullscreen) return;

				if (
					currentTarget.contains(relatedTarget)
					|| listReference.current?.contains(relatedTarget)
				)
					return;

				close();
			}}
			onClick={() => {
				inputReference.current?.focus();
				// An input may be closed but already focused (won't get a focus event), so
				// we need to open it manually.
				open();
			}}
			onFocus={open}
			onPointerDownCapture={() => {
				if (!overlayVisible) scrollReference.current = window.scrollY;
			}}
		>
			<div
				className={twMerge(
					"contents",
					fullscreen
					&& "fixed inset-0 z-[1000] flex flex-col bg-white-30 vision:bg-white-30/80 dark:bg-black-60"
				)}
			>
				<Popover open={overlayVisible && desktop}>
					<PopoverAnchor
						className={twMerge(
							"focusable-within flex rounded-xl bg-white-40 px-1.5 py-1 text-black-70 shadow-brand-1 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20",
							// Stays interactive while the page has pointer events disabled. Suppress
							// touch events that can bypass the scroll lock.
							overlayVisible && desktop && "pointer-events-auto touch-none",
							fullscreen
							&& "shrink-0 rounded-none pt-[calc(var(--safe-area-inset-top,0rem)+0.25rem)] focus-within:ring-0 focus-within:ring-offset-0 dark:bg-black-50"
						)}
						ref={anchorReference}
						// Keep focus in the input: the keyboard stays up, and focus never
						// lands on a pill that is about to unmount.
						onMouseDown={(event) => {
							if (event.target !== inputReference.current)
								event.preventDefault();
						}}
					>
						{fullscreen && (
							<button
								aria-label={t("back")}
								className="-ml-0.5 flex shrink-0 items-center self-stretch px-1"
								type="button"
								onClick={(event) => {
									event.stopPropagation();

									inputReference.current?.blur();
									close();
								}}
							>
								<ChevronLeft className="size-6" />
							</button>
						)}
						<div
							className={twMerge(
								"flex flex-wrap items-center gap-1.5",
								fullscreen && "grow"
							)}
						>
							{selectedOptions.map((option) => (
								<button
									key={option.key}
									className="focusable h-fit translate-x-[-2px] translate-y-[-0.5px] rounded-xl bg-brand-gradient px-3 py-1 text-left shadow-brand-1"
									type="button"
									onClick={() => onChange(value.filter((key) => key !== option.key))}
								>
									<span className="pointer-events-none font-nunito text-lg text-white-20">
										{option.label}
									</span>
								</button>
							))}
							<input
								className={twMerge(
									"grow border-none bg-transparent py-1.5 caret-theme-2 placeholder:text-black-50 focus:ring-transparent placeholder:dark:text-white-50",
									!overlayVisible && "caret-transparent"
								)}
								style={{
									width:
										overlayVisible || inputValue.length || placeholder?.length
											? `${(inputValue.length || placeholder?.length || 1) + 2}em`
											: 0
								}}
								autoComplete="off"
								placeholder={placeholder}
								ref={inputReference}
								type="text"
								value={inputValue}
								// Block input when focused but closed (after Esc or outside
								// click).
								onBeforeInput={(event) => {
									if (!overlayVisible) event.preventDefault();
								}}
								onChange={({ currentTarget }) => {
									if (!overlayVisible) return;
									setInputValue(currentTarget.value);
								}}
								onKeyDown={onInputKeyDown}
							/>
						</div>
					</PopoverAnchor>
					{fullscreen && (
						<div className="h-0.5 shrink-0 bg-brand-gradient" />
					)}
					<PopoverContent
						style={{
							"--overlay-max-height":
								"min(28rem, var(--radix-popover-content-available-height))"
						} as CSSProperties}
						align="start"
						className="pointer-events-auto relative z-50 flex w-[var(--radix-popper-anchor-width)]"
						collisionPadding={safeArea}
						side="bottom"
						onCloseAutoFocus={(event) => event.preventDefault()}
						onEscapeKeyDown={(event) => {
							event.preventDefault();
							inputReference.current?.focus();

							close();
						}}
						onOpenAutoFocus={(event) => event.preventDefault()}
						onPointerDownOutside={(event) => {
							const { originalEvent } = event.detail;

							// The input is at the anchor, outside the content, so interacting
							// with it counts as "outside" too; leave it alone.
							if (anchorReference.current?.contains(originalEvent.target as Node))
								return;

							// On touch this fires on the tap's click; the tap landed on nothing
							// (outside pointer events are disabled), so close and drop focus to
							// dismiss the keyboard.
							if (originalEvent.type !== "pointerdown") {
								inputReference.current?.blur();
								close();
								return;
							}

							// Outside press keeps the input focused and closes the window,
							// without activating whatever was pressed.
							originalEvent.preventDefault();
							suppressNextClick();

							close();
						}}
					>
						{optionList}
					</PopoverContent>
				</Popover>
				{fullscreen && (
					<div className="relative flex min-h-0 flex-1 flex-col">
						{optionList}
					</div>
				)}
			</div>
		</div>
	);
};
