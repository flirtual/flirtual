"use client";

import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import React, { useCallback, useRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface InputSelectOption<K extends string = string> {
	key: K;
	label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InputOptionEvent<T extends React.SyntheticEvent<any>, K extends string = string> = T & {
	option: InputSelectOption<K>;
};

export type InputOptionWindowProps<K extends string = string> = Omit<
	React.ComponentProps<"div">,
	"onChange"
> & {
	options: Array<InputSelectOption<K>>;
	onOptionClick?: React.EventHandler<InputOptionEvent<React.MouseEvent<HTMLButtonElement>, K>>;
	onOptionFocus?: React.EventHandler<InputOptionEvent<React.FocusEvent<HTMLButtonElement>, K>>;
};

export const InputOptionWindow = forwardRef<HTMLDivElement, InputOptionWindowProps>(
	(props, ref) => {
		const { options, onOptionClick, onOptionFocus, ...elementProps } = props;
		const optionsRef = useRef<HTMLDivElement>(null);

		const focusOption = useCallback((direction: -1 | 1 | 0) => {
			const { current: root } = optionsRef;
			if (!root) return;

			if (!root.contains(document.activeElement) || !document.activeElement || direction === 0) {
				if (root.firstChild instanceof HTMLElement) root.firstChild.focus();
				return;
			}

			const sibling =
				document.activeElement[direction === -1 ? "previousSibling" : "nextSibling"] ??
				root[direction === -1 ? "lastChild" : "firstChild"];
			if (sibling instanceof HTMLElement) sibling.focus();
		}, []);

		return (
			<div
				{...elementProps}
				ref={ref}
				tabIndex={-1}
				className={twMerge(
					"focusable-within max-h-52 w-full overflow-x-hidden overflow-y-scroll rounded-xl bg-white-20 shadow-brand-1 dark:bg-black-70",
					elementProps.className
				)}
				onFocusCapture={(event) => {
					props.onFocusCapture?.(event);

					if (event.currentTarget !== event.target) return;
					focusOption(0);
				}}
				onKeyDown={(event) => {
					props.onKeyDown?.(event);

					switch (event.key) {
						case "ArrowUp": {
							event.preventDefault();
							focusOption(-1);
							return;
						}
						case "ArrowDown": {
							event.preventDefault();
							focusOption(1);
							return;
						}
					}
				}}
			>
				<div className="flex w-full flex-col" ref={optionsRef}>
					{options.map((option) => (
						<button
							className="px-4 py-2 text-left text-black-70 hover:bg-white-40 focus:bg-brand-gradient focus:text-white-20 focus:outline-none dark:text-white-20 hover:dark:bg-black-80/50 focus:dark:text-white-20"
							data-key={option.key}
							data-name={option.label}
							key={option.key}
							type="button"
							onClick={(event) => onOptionClick?.(Object.assign(event, { option }))}
							onFocus={(event) => onOptionFocus?.(Object.assign(event, { option }))}
						>
							<span className="select-none font-nunito text-lg">{option.label}</span>
						</button>
					))}
				</div>
			</div>
		);
	}
);

export interface InputSelectProps<T extends string> {
	value: T;
	onChange: React.Dispatch<T>;
	placeholder?: string;
	options: Array<InputSelectOption<T>>;
}

export function InputSelect<K extends string = string>(props: InputSelectProps<K>) {
	const { placeholder = "Select an option" } = props;

	const label = props.options.find((option) => option.key === props.value)?.label;

	return (
		<div
			className="group relative"
			onKeyDown={({ code, currentTarget }) => {
				if (!code.startsWith("Key")) return;
				const key = code.slice(3).toLowerCase();
				const elements = currentTarget.querySelectorAll("*[data-key]");

				for (let i = 0; i < elements.length; i++) {
					const element = elements[i];
					if (
						!(element instanceof HTMLElement) ||
						!element.dataset.name?.toLowerCase().startsWith(key)
					)
						continue;

					element.focus({});
					props.onChange(element.dataset.key as K);

					return;
				}
			}}
		>
			<button
				className="focusable-within flex w-full items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20"
				type="button"
			>
				<div className="flex items-center justify-center bg-brand-gradient p-2 text-white-20">
					<ChevronUpDownIcon className="h-7 w-7" />
				</div>
				<span className={twMerge("px-4 py-2", label ? "" : "text-black-50 dark:text-white-50")}>
					{label || placeholder}
				</span>
			</button>
			<InputOptionWindow
				className="absolute z-10 mt-4 hidden group-focus-within:flex"
				options={props.options}
				onOptionClick={({ option, currentTarget }) => {
					props.onChange(option.key as K);
					currentTarget.blur();
				}}
			/>
		</div>
	);
}
