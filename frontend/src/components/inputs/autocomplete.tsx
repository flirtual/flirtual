import React, { useCallback, useMemo, useRef, useState } from "react";
import { search as fuzzySearch } from "fast-fuzzy";

import { OptionWindow } from "./select";

export interface AutocompleteOption {
	key: string;
	label: string;
}

export interface AutocompleteProps {
	options: Array<AutocompleteOption>;
	values: Array<string>;
	onChange: React.Dispatch<React.SetStateAction<Array<string>>>;
}

export const Autocomplete: React.FC<AutocompleteProps> = (props) => {
	const { values, options } = props;

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
			<div className="bg-brand-grey shadow-brand-1 group-focus-within:ring-brand-coral flex group-focus-within:ring-offset-2 rounded-xl group-focus-within:ring-2 p-2">
				<div className="flex gap-1.5 flex-wrap items-center">
					{values.map((value) => (
						<button
							className="bg-brand-gradient shadow-brand-1 focus:ring-brand-coral px-3 py-2 rounded-xl h-fit focus:outline-none focus:ring-2 focus:ring-offset-2"
							key={value}
							type="button"
							onClick={() => {
								props.onChange.call(null, (values) => values.filter((v) => v !== value));
							}}
						>
							<span className="font-nunito text-lg text-white pointer-events-none select-none">
								{options.find((option) => option.key === value)?.label}
							</span>
						</button>
					))}
					<input
						className="text-xl grow border-none bg-transparent focus:ring-transparent"
						ref={inputRef}
						type="text"
						value={inputValue}
						style={{
							width: `${inputValue.length + 1}em`
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
			<OptionWindow
				className="hidden group-focus-within:flex absolute mt-4"
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
