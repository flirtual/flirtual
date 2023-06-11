"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { search as fuzzySearch, fuzzy } from "fast-fuzzy";
import { motion, AnimatePresence } from "framer-motion";

import { InputOptionWindow } from "./option-window";

export interface InputAutocompleteOption<K extends string = string> {
	key: K;
	label: string;
	hidden?: boolean;
}

export interface InputAutocompleteProps<K extends string = string> {
	options: Array<InputAutocompleteOption<K>>;
	value: Array<K>;
	placeholder?: string;
	limit?: number;
	id?: string;
	supportArbitrary?: boolean;
	onChange: React.Dispatch<Array<K>>;
}

export function InputAutocomplete<K extends string>(
	props: InputAutocompleteProps<K>
) {
	const {
		value: values = [],
		limit = Number.POSITIVE_INFINITY,
		supportArbitrary = false,
		onChange,
		options,
		...elementProps
	} = props;

	const visibleValueOptions = useMemo(
		() =>
			options.length === 0
				? []
				: values
						.map((value) => {
							const option =
								options.find((option) => option.key === value) ??
								(supportArbitrary
									? {
											key: value,
											label: value,
											hidden: false
									  }
									: undefined);

							return !option?.hidden && option;
						})
						.filter(Boolean),
		[options, values, supportArbitrary]
	);

	const placeholder = visibleValueOptions.length > 0 ? "" : props.placeholder;

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
		onChange.call(null, values.slice(0, limit));
	}, [limit, onChange, values]);

	return (
		<div
			{...elementProps}
			className="group relative"
			onClick={() => inputReference.current?.focus()}
			onFocus={() => setOverlayVisible(true)}
			onBlur={({ currentTarget, relatedTarget }) => {
				if (currentTarget.contains(relatedTarget)) return;
				setOverlayVisible(false);
				setInputValue("");
			}}
			onKeyDown={(event) => {
				if (
					(event.key !== "ArrowUp" && event.key !== "ArrowDown") ||
					optionWindowReference.current?.contains(document.activeElement)
				)
					return;

				optionWindowReference.current?.focus();
				event.preventDefault();
			}}
		>
			<div className="focusable-within flex rounded-xl bg-white-40 px-2 py-1 text-black-70 shadow-brand-1 dark:bg-black-60 dark:text-white-20">
				<div className="flex flex-wrap items-center gap-1.5">
					{visibleValueOptions.map((option) => {
						return (
							<button
								className="focusable h-fit rounded-xl bg-brand-gradient px-3 py-1 shadow-brand-1"
								key={option.key}
								type="button"
								onClick={() => {
									props.onChange(values.filter((v) => v !== option.key));
								}}
							>
								<span className="pointer-events-none select-none font-nunito text-lg text-white-20">
									{option.label}
								</span>
							</button>
						);
					})}
					<input
						autoComplete="off"
						className="grow border-none bg-transparent placeholder:text-black-50 focus:ring-transparent placeholder:dark:text-white-50"
						placeholder={placeholder}
						ref={inputReference}
						type="text"
						value={inputValue}
						style={{
							// eslint-disable-next-line unicorn/explicit-length-check
							width: `${(inputValue.length || placeholder?.length || 1) + 1}em`
						}}
						onChange={onInputChange}
						onKeyDown={(event) => {
							const { key, currentTarget } = event;
							const value = currentTarget.value.trim();

							if (key === "Enter" && value.length > 0) {
								const exactMatchOption = options.find(
									({ label }) => label.toLowerCase() === value.toLowerCase()
								);

								if (
									exactMatchOption ||
									// If there is only one suggestion and it's close enough to the input.
									(suggestions.length === 1 &&
										fuzzy(value, suggestions[0].key) > 0.7)
								) {
									props.onChange([
										...values,
										exactMatchOption?.key ?? suggestions[0].key
									]);
									setInputValue("");

									event.preventDefault();
									return;
								}

								if (supportArbitrary) {
									props.onChange([...values, value as K]);
									setInputValue("");

									event.preventDefault();
									return;
								}
							}

							if (key !== "Backspace" || value.length > 0) return;
							event.preventDefault();

							const lastValue = values.at(-1);
							props.onChange(values.filter((value) => value !== lastValue));
						}}
					/>
				</div>
			</div>
			<AnimatePresence>
				{overlayVisible && (
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
								props.onChange([...values, option.key as K]);

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
