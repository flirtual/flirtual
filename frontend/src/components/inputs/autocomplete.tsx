"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { search as fuzzySearch } from "fast-fuzzy";

import { InputOptionWindow } from "./select";

export interface InputAutocompleteOption<K extends string> {
	key: K;
	label: string;
	hidden?: boolean;
}

export interface InputAutocompleteProps<K extends string> {
	options: Array<InputAutocompleteOption<K>>;
	value: Array<K>;
	placeholder?: string;
	limit?: number;
	onChange: React.Dispatch<Array<K>>;
}

export function InputAutocomplete<K extends string>(props: InputAutocompleteProps<K>) {
	const { value: values = [], limit = Infinity, options } = props;
	const visibleValues = values.filter((value) => {
		const option = options.find((option) => option.key === value);
		return option && !option.hidden;
	});

	const placeholder = visibleValues.length ? "" : props.placeholder;

	const inputRef = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState("");

	const optionWindowRef = useRef<HTMLDivElement>(null);

	const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
		({ currentTarget }) => {
			setInputValue(currentTarget.value);
		},
		[]
	);

	const suggestions = useMemo(() => {
		const excludedOptions = options.filter(({ key, hidden }) => !values.includes(key) && !hidden);
		if (inputValue.trim().length === 0) return excludedOptions;

		return fuzzySearch(inputValue, excludedOptions, { keySelector: (option) => option.label });
	}, [inputValue, options, values]);

	return (
		<div
			className="group relative"
			onClick={() => inputRef.current?.focus()}
			onBlur={({ currentTarget, relatedTarget }) => {
				if (currentTarget.contains(relatedTarget)) return;
				setInputValue("");
			}}
			onKeyDown={(event) => {
				if (
					(event.key !== "ArrowUp" && event.key !== "ArrowDown") ||
					optionWindowRef.current?.contains(document.activeElement)
				)
					return;

				optionWindowRef.current?.focus();
				event.preventDefault();
			}}
		>
			<div className="focusable-within flex rounded-xl bg-white-40 px-2 py-1 text-black-70 shadow-brand-1 dark:bg-black-60 dark:text-white-20">
				<div className="flex flex-wrap items-center gap-1.5">
					{visibleValues.map((value) => {
						const option = options.find((option) => option.key === value);
						if (!option || option.hidden) return null;

						return (
							<button
								className="focusable h-fit rounded-xl bg-brand-gradient px-3 py-1 shadow-brand-1"
								key={value}
								type="button"
								onClick={() => {
									props.onChange(values.filter((v) => v !== value));
								}}
							>
								<span className="pointer-events-none select-none font-nunito text-lg text-white-20">
									{option.label}
								</span>
							</button>
						);
					})}
					<input
						className="grow border-none bg-transparent placeholder:text-black-50 focus:ring-transparent placeholder:dark:text-white-50"
						placeholder={placeholder}
						ref={inputRef}
						type="text"
						value={inputValue}
						style={{
							width: `${(inputValue.length || placeholder?.length || 1) + 1}em`
						}}
						onChange={onInputChange}
						onKeyDown={(event) => {
							const { key, currentTarget } = event;

							if (key === "Enter" && suggestions.length === 1) {
								props.onChange([...values, suggestions[0].key]);
								setInputValue("");

								return;
							}

							if (key !== "Backspace" || currentTarget.value.length !== 0) return;
							event.preventDefault();

							const lastValue = values.at(-1);
							props.onChange(values.filter((value) => value !== lastValue));
						}}
					/>
				</div>
			</div>
			<InputOptionWindow
				className="absolute z-10 mt-4 hidden group-focus-within:flex"
				options={suggestions}
				ref={optionWindowRef}
				onOptionClick={({ option }) => {
					if (values.length === limit) return;
					props.onChange([...values, option.key as K]);

					inputRef.current?.focus();
					setInputValue("");
				}}
			/>
		</div>
	);
}
