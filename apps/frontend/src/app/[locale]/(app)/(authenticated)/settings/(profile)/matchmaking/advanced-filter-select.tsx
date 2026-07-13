import { search as fuzzySearch } from "fast-fuzzy";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { FC, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Badge } from "~/components/badge";
import { Link } from "~/components/link";
import { urls } from "~/urls";

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
	const [inputValue, setInputValue] = useState("");
	const [overlayVisible, setOverlayVisible] = useState(false);
	const inputReference = useRef<HTMLInputElement>(null);
	const listReference = useRef<HTMLDivElement>(null);

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

	return (
		<div
			id={id}
			className="group relative"
			onBlur={({ currentTarget, relatedTarget }) => {
				if (currentTarget.contains(relatedTarget)) return;
				setOverlayVisible(false);
				setInputValue("");
			}}
			onClick={() => inputReference.current?.focus()}
			onFocus={() => setOverlayVisible(true)}
		>
			<div className="focusable-within flex rounded-xl bg-white-40 px-1.5 py-1 text-black-70 shadow-brand-1 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20">
				<div className="flex flex-wrap items-center gap-1.5">
					{selectedOptions.map((option) => (
						<button
							key={option.key}
							className="focusable h-fit rounded-xl bg-brand-gradient px-3 py-1 text-left shadow-brand-1"
							type="button"
							onClick={() => onChange(value.filter((key) => key !== option.key))}
						>
							<span className="pointer-events-none font-nunito text-lg text-white-20">
								{option.label}
							</span>
						</button>
					))}
					<input
						style={{
							width: `${(inputValue.length || placeholder?.length || 1) + 2}em`
						}}
						autoComplete="off"
						className="grow border-none bg-transparent caret-theme-2 placeholder:text-black-50 focus:ring-transparent placeholder:dark:text-white-50"
						placeholder={placeholder}
						ref={inputReference}
						type="text"
						value={inputValue}
						onChange={({ currentTarget }) => setInputValue(currentTarget.value)}
						onKeyDown={onInputKeyDown}
					/>
				</div>
			</div>
			<AnimatePresence>
				{overlayVisible && (
					<m.div
						animate={{ height: "max-content" }}
						className="absolute z-10 mt-4 flex w-full"
						exit={{ height: 0 }}
						initial={{ height: 0 }}
						transition={{ damping: 25 }}
						// Motion resolves "max-content" to a pixel height measured at open,
						// which goes stale as options load; clear it so the list's own
						// viewport-based max-height governs while open.
						onAnimationComplete={(definition) => {
							if (
								typeof definition === "object"
								&& definition !== null
								&& "height" in definition
								&& definition.height === "max-content"
							)
								listReference.current?.parentElement?.style.removeProperty("height");
						}}
					>
						<div
							className="flex max-h-[min(28rem,60svh)] w-full flex-col overflow-y-auto overscroll-contain rounded-xl bg-white-30 shadow-brand-1 focus:outline-none vision:bg-white-30/80 dark:bg-black-60"
							ref={listReference}
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
					</m.div>
				)}
			</AnimatePresence>
		</div>
	);
};
