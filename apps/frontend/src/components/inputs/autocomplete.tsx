import { Slot } from "@radix-ui/react-slot";
import { fuzzy, search as fuzzySearch } from "fast-fuzzy";
import { ChevronLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RemoveScroll } from "react-remove-scroll";
import { twMerge } from "tailwind-merge";

import { useBreakpoint } from "~/hooks/use-breakpoint";
import { useDisableOutsidePointerEvents } from "~/hooks/use-disable-outside-pointer-events";
import { useSafeArea } from "~/hooks/use-safe-area";
import { emptyArray, suppressNextClick } from "~/utilities";

import { InlineLink } from "../inline-link";
import { Popover, PopoverAnchor, PopoverContent } from "../popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { InputOptionWindow } from "./option-window";

export interface InputAutocompleteOption<K extends string = string> {
	key: K;
	label: string;
	example?: string;
	definition?: string;
	definitionLink?: string;
	hidden?: boolean;
}

export interface InputAutocompleteProps<K extends string = string> {
	options: Array<InputAutocompleteOption<K>>;
	value: Array<K>;
	placeholder?: string;
	limit?: number;
	id?: string;
	dropdown?: boolean;
	supportArbitrary?: boolean;
	onChange: React.Dispatch<Array<K>>;
}

export function InputAutocomplete<K extends string>(
	props: InputAutocompleteProps<K>
) {
	const {
		value: values = emptyArray,
		limit = Number.POSITIVE_INFINITY,
		dropdown = true,
		supportArbitrary = false,
		placeholder: _placeholder,
		onChange,
		options,
		...elementProps
	} = props;

	const { t } = useTranslation();
	const visibleValueOptions = useMemo(
		() =>
			options.length === 0
				? []
				: values
						.map((value) => {
							const option
								= options.find((option) => option.key === value)
									?? (supportArbitrary
										? {
												key: value,
												label: value,
												definition: value,
												definitionLink: value,
												hidden: false
											}
										: undefined);

							return !option?.hidden && option;
						})
						.filter(Boolean),
		[options, values, supportArbitrary]
	);

	const placeholder = visibleValueOptions.length > 0 ? "" : _placeholder;

	const safeArea = useSafeArea();
	const desktop = useBreakpoint("desktop");
	const rootReference = useRef<HTMLDivElement>(null);
	const anchorReference = useRef<HTMLDivElement>(null);
	const inputReference = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [overlayVisible, setOverlayVisible] = useState(false);
	const [reservedHeight, setReservedHeight] = useState<number>();

	const optionWindowReference = useRef<HTMLDivElement>(null);

	const fullscreen = dropdown && overlayVisible && !desktop;
	const caretVisible = !dropdown || overlayVisible;

	useDisableOutsidePointerEvents(dropdown && overlayVisible && desktop);

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

	const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
		({ currentTarget }) => {
			if (dropdown && !overlayVisible) return;
			setInputValue(currentTarget.value);
		},
		[dropdown, overlayVisible]
	);

	const potentialOptions = useMemo(
		() => options.filter(({ key, hidden }) => !values.includes(key) && !hidden),
		[options, values]
	);

	const suggestions = useMemo(
		() =>
			inputValue
				? fuzzySearch(inputValue, potentialOptions, {
						keySelector: (option) => option.label
					})
				: potentialOptions,
		[inputValue, potentialOptions]
	);

	useEffect(() => {
		if (values.length <= limit) return;
		onChange(values.slice(0, limit));
	}, [limit, onChange, values]);

	const optionWindow = (
		<RemoveScroll allowPinchZoom as={Slot}>
			<InputOptionWindow
				className={
					fullscreen
						? "min-h-0 w-full flex-1 rounded-none shadow-none focus-within:ring-0 focus-within:ring-offset-0"
						: undefined
				}
				options={suggestions}
				ref={optionWindowReference}
				style={fullscreen ? { "--overlay-max-height": "100%" } as CSSProperties : undefined}
				onOptionClick={({ option }) => {
					if (values.length === limit) return;
					onChange([...values, option.key as K]);

					inputReference.current?.focus();
					setInputValue("");
				}}
			/>
		</RemoveScroll>
	);

	return (
		<div
			{...elementProps}
			className="group relative"
			ref={rootReference}
			style={fullscreen ? { height: reservedHeight } : undefined}
			onBlur={({ currentTarget, relatedTarget }) => {
				if (fullscreen) return;

				if (
					currentTarget.contains(relatedTarget)
					|| optionWindowReference.current?.contains(relatedTarget)
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
			onKeyDown={(event) => {
				if (event.key === "Escape" && fullscreen) {
					inputReference.current?.blur();
					close();
					return;
				}

				if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

				if (dropdown && !overlayVisible) {
					open();
					event.preventDefault();
					return;
				}

				if (optionWindowReference.current?.contains(document.activeElement))
					return;

				optionWindowReference.current?.focus();
				event.preventDefault();
			}}
			onPointerDownCapture={() => {
				if (!overlayVisible) scrollReference.current = window.scrollY;
			}}
		>
			<div
				className={twMerge(
					"contents",
					fullscreen
					&& "fixed inset-0 z-[1000] flex flex-col bg-white-20 dark:bg-black-60"
				)}
			>
				<Popover open={dropdown && overlayVisible && desktop}>
					<PopoverAnchor
						className={twMerge(
							"focusable-within flex rounded-xl bg-white-40 px-1.5 py-1 text-black-70 shadow-brand-1 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20",
							// Stays interactive while the page has pointer events disabled. Suppress
							// touch events that can bypass the scroll lock.
							dropdown && overlayVisible && desktop && "pointer-events-auto touch-none",
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
							{visibleValueOptions.map((option) => {
								return (
									<button
										key={option.key}
										className="focusable h-fit translate-x-[-2px] translate-y-[-0.5px] rounded-xl bg-brand-gradient px-3 py-1 text-left shadow-brand-1"
										type="button"
										onClick={() => onChange(values.filter((v) => v !== option.key))}
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<div>
													<span className="pointer-events-none font-nunito text-lg text-white-20">
														{option.label}
													</span>
												</div>
											</TooltipTrigger>
											{(option.definition || option.definitionLink) && (
												<TooltipContent>
													{option.definition}
													{" "}
													{option.definitionLink && (
														<InlineLink
															className="pointer-events-auto"
															href={option.definitionLink}
														>
															{t("learn_more")}
														</InlineLink>
													)}
												</TooltipContent>
											)}
										</Tooltip>
									</button>
								);
							})}
							<input
								className={twMerge(
									"grow border-none bg-transparent py-1.5 caret-theme-2 placeholder:text-black-50 focus:ring-transparent placeholder:dark:text-white-50",
									!caretVisible && "caret-transparent"
								)}
								style={{
									width:
										caretVisible || inputValue.length || placeholder?.length
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
									if (dropdown && !overlayVisible) event.preventDefault();
								}}
								onChange={onInputChange}
								onKeyDown={(event) => {
									if (dropdown && !overlayVisible) {
										if (event.key === "Enter") {
											open();
											event.preventDefault();
										}

										return;
									}

									const { key, currentTarget } = event;
									const value = currentTarget.value.trim();

									if (key === "Enter" && value.length > 0) {
										const exactMatchOption = options.find(
											({ label }) => label.toLowerCase() === value.toLowerCase()
										);

										if (
											exactMatchOption
											// If there is only one suggestion and it's close enough to the input.
											|| (suggestions.length === 1
												&& fuzzy(value, suggestions[0]!.key) > 0.7)
										) {
											onChange([
												...values,
												exactMatchOption?.key ?? suggestions[0]!.key
											]);
											setInputValue("");

											event.preventDefault();
											return;
										}

										if (supportArbitrary) {
											onChange([...values, value as K]);
											setInputValue("");

											event.preventDefault();
											return;
										}
									}

									if (key !== "Backspace" || value.length > 0) return;
									event.preventDefault();

									const lastValue = values.at(-1);
									onChange(values.filter((value) => value !== lastValue));
								}}
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
						className="pointer-events-auto z-50 flex w-[var(--radix-popper-anchor-width)]"
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
						{optionWindow}
					</PopoverContent>
				</Popover>
				{fullscreen && optionWindow}
			</div>
		</div>
	);
}
