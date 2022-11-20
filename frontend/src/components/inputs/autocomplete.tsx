"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { search as fuzzySearch } from "fast-fuzzy";

import { InputOptionWindow } from "./select";

export interface InputAutocompleteOption {
	key: string;
	label: string;
}

export interface InputAutocompleteProps {
	options: Array<InputAutocompleteOption>;
	values: Array<string>;
	placeholder?: string;
	onChange: React.Dispatch<React.SetStateAction<Array<string>>>;
}

export const InputAutocomplete: React.FC<InputAutocompleteProps> = (props) => {
	const { values, options } = props;

	const placeholder = values.length ? "" : props.placeholder;

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
		const excludedOptions = options.filter((option) => !values.includes(option.key));
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
			<div className="flex rounded-xl bg-brand-grey p-2 shadow-brand-1 group-focus-within:ring-2 group-focus-within:ring-brand-coral group-focus-within:ring-offset-2">
				<div className="flex flex-wrap items-center gap-1.5">
					{values.map((value) => (
						<button
							className="h-fit rounded-xl bg-brand-gradient px-3 py-2 shadow-brand-1 focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2"
							key={value}
							type="button"
							onClick={() => {
								props.onChange.call(null, (values) => values.filter((v) => v !== value));
							}}
						>
							<span className="pointer-events-none select-none font-nunito text-lg text-white">
								{options.find((option) => option.key === value)?.label}
							</span>
						</button>
					))}
					<input
						className="grow border-none bg-transparent text-xl focus:ring-transparent"
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

							if (key !== "Backspace" || currentTarget.value.length !== 0) return;
							event.preventDefault();

							props.onChange.call(null, (values) => {
								const lastValue = values.at(-1);
								return values.filter((value) => value !== lastValue);
							});
						}}
					/>
				</div>
			</div>
			<InputOptionWindow
				className="absolute mt-4 hidden group-focus-within:flex"
				options={suggestions}
				ref={optionWindowRef}
				onOptionClick={({ option }) => {
					props.onChange.call(null, (values) => [...values, option.key]);

					inputRef.current?.focus();
					setInputValue("");
				}}
			/>
		</div>
	);
};
