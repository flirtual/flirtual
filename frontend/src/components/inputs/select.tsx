"use client";

import React, { useCallback, useRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface InputSelectOption {
	key: string;
	label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InputOptionEvent<T extends React.SyntheticEvent<any>> = T & {
	option: InputSelectOption;
};

export type InputOptionWindowProps = Omit<React.ComponentProps<"div">, "onChange"> & {
	options: Array<InputSelectOption>;
	onOptionClick?: React.EventHandler<InputOptionEvent<React.MouseEvent<HTMLButtonElement>>>;
	onOptionFocus?: React.EventHandler<InputOptionEvent<React.FocusEvent<HTMLButtonElement>>>;
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
					"max-h-52 w-full overflow-x-hidden overflow-y-scroll rounded-xl bg-white-20 shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-70 focus-within:dark:ring-offset-black-50",
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
							className="px-4 py-2 text-left text-black-70 hover:bg-white-40 focus:bg-brand-gradient focus:text-white-20 focus:outline-none dark:text-white-20 hover:dark:bg-black-80/50 focus:dark:text-black-60"
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

export const InputSelect: React.FC = () => {
	return (
		<div>
			<input />
		</div>
	);
};
