import React, { useCallback, useMemo, useRef, useState } from "react";
import { search as fuzzySearch } from "fast-fuzzy";

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

	const selectionRef = useRef<HTMLDivElement>(null);

	const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
		({ currentTarget }) => {
			setInputValue(currentTarget.value);
		},
		[]
	);

	const focusSuggestion = useCallback((direction: -1 | 1) => {
		const { current: root } = selectionRef;
		if (!root) return;

		if (!root.contains(document.activeElement) || !document.activeElement) {
			if (root.firstChild instanceof HTMLElement) root.firstChild.focus();
			return;
		}

		const sibling = document.activeElement[direction === -1 ? "previousSibling" : "nextSibling"];
		if (sibling instanceof HTMLElement) sibling.focus();
	}, []);

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
				switch (event.key) {
					case "ArrowUp": {
						event.preventDefault();
						focusSuggestion(-1);
						return;
					}
					case "ArrowDown": {
						event.preventDefault();
						focusSuggestion(1);
						return;
					}
				}
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
			<div className="bg-brand-white shadow-brand-1 focus-within:ring-brand-coral focus:outline-none hidden focus-within:ring-2 focus-within:ring-offset-2 group-focus-within:flex absolute w-full mt-4 rounded-xl max-h-52 overflow-y-scroll overflow-x-hidden">
				<div className="flex flex-col w-full" ref={selectionRef}>
					{suggestions.map(({ key, label }) => (
						<button
							className="hover:bg-brand-gradient focus:bg-brand-gradient focus:text-white hover:text-white focus:outline-none px-4 py-2 text-left"
							key={key}
							type="button"
							onClick={() => {
								props.onChange.call(null, (values) => [...values, key]);
								inputRef.current?.focus();
								setInputValue("");
							}}
						>
							<span className="font-nunito text-lg">{label}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
