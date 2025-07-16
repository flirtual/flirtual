import { fuzzy, search as fuzzySearch } from "fast-fuzzy";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { emptyArray } from "~/utilities";

import { InlineLink } from "../inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { InputOptionWindow } from "./option-window";

export interface InputAutocompleteOption<K extends string = string> {
	key: K;
	label: string;
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

	const inputReference = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [overlayVisible, setOverlayVisible] = useState(false);

	const optionWindowReference = useRef<HTMLDivElement>(null);

	const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
		({ currentTarget }) => {
			setInputValue(currentTarget.value);
		},
		[]
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

	return (
		<div
			{...elementProps}
			className="group relative"
			onBlur={({ currentTarget, relatedTarget }) => {
				if (currentTarget.contains(relatedTarget)) return;
				setOverlayVisible(false);
				setInputValue("");
			}}
			onClick={() => inputReference.current?.focus()}
			onFocus={() => setOverlayVisible(true)}
			onKeyDown={(event) => {
				if (
					(event.key !== "ArrowUp" && event.key !== "ArrowDown")
					|| optionWindowReference.current?.contains(document.activeElement)
				)
					return;

				optionWindowReference.current?.focus();
				event.preventDefault();
			}}
		>
			<div className="focusable-within flex rounded-xl bg-white-40 px-2 py-1 text-black-70 shadow-brand-1 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20">
				<div className="flex flex-wrap items-center gap-1.5">
					{visibleValueOptions.map((option) => {
						return (
							<button
								className="focusable h-fit rounded-xl bg-brand-gradient px-3 py-1 shadow-brand-1"
								key={option.key}
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
						style={{
							width: `${(inputValue.length || placeholder?.length || 1) + 2}em`
						}}
						autoComplete="off"
						className="grow border-none bg-transparent caret-theme-2 placeholder:text-black-50 focus:ring-transparent placeholder:dark:text-white-50"
						placeholder={placeholder}
						ref={inputReference}
						type="text"
						value={inputValue}
						onChange={onInputChange}
						onKeyDown={(event) => {
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
			</div>
			<AnimatePresence>
				{dropdown && overlayVisible && (
					<motion.div
						animate={{ height: "max-content" }}
						className="absolute z-10 mt-4 flex w-full"
						exit={{ height: 0 }}
						initial={{ height: 0 }}
						transition={{ damping: 25 }}
					>
						<InputOptionWindow
							options={suggestions}
							ref={optionWindowReference}
							onOptionClick={({ option }) => {
								if (values.length === limit) return;
								onChange([...values, option.key as K]);

								inputReference.current?.focus();
								setInputValue("");
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
