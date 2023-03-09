"use client";

import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import React, { useCallback, useRef, forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export interface InputSelectOption<K extends string = string> {
	key: K;
	label: string;
	active?: boolean;
}

export type InputOptionEvent<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends React.SyntheticEvent<any>,
	K extends string = string
> = T & {
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

function getFirstActiveElement(root: HTMLElement): HTMLElement {
	return (
		([...root.children] as Array<HTMLElement>).find(
			(element) => element.dataset.active === "true"
		) || (root.firstChild as HTMLElement)
	);
}

export const InputOptionWindow = forwardRef<HTMLDivElement, InputOptionWindowProps>(
	(props, ref) => {
		const { options, onOptionClick, onOptionFocus, ...elementProps } = props;
		const optionsRef = useRef<HTMLDivElement>(null);

		const focusOption = useCallback((target: -1 | 1 | 0) => {
			const { current: root } = optionsRef;
			if (!root) return;

			const firstActiveElement = getFirstActiveElement(root);
			if (!root.contains(document.activeElement) || !document.activeElement || target === 0) {
				if (root.firstChild instanceof HTMLElement) firstActiveElement.focus();
				return;
			}

			const sibling =
				document.activeElement[target === -1 ? "previousSibling" : "nextSibling"] ??
				root[target === -1 ? "lastChild" : "firstChild"];
			if (sibling instanceof HTMLElement) sibling.focus();
		}, []);

		// useEffect(() => focusOption(0), [focusOption]);

		return (
			<div
				ref={ref}
				tabIndex={-1}
				className={twMerge(
					"focusable-within flex max-h-52 w-full overflow-x-hidden overflow-y-scroll rounded-xl bg-white-20 shadow-brand-1 dark:bg-black-70",
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
							data-active={option.active}
							data-key={option.key}
							key={option.key}
							type="button"
							className={twMerge(
								"px-4 py-2 text-left ",
								option.active
									? "bg-brand-gradient text-white-20"
									: "text-black-70 hover:bg-white-40 focus:text-white-20 focus:outline-none dark:text-white-20 hover:dark:bg-black-80/50 focus:dark:text-white-20"
							)}
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

export interface InputSelectProps<T extends string = string> {
	value: T;
	onChange: React.Dispatch<T>;
	placeholder?: string;
	options: Array<InputSelectOption<T>>;
}

export function InputSelect<K extends string = string>(props: InputSelectProps<K>) {
	const { placeholder = "Select an option" } = props;
	const [overlayVisible, setOverlayVisible] = useState(false);

	const activeOption = props.options.find((option) => option.key === props.value);
	const options = props.options.map((option) => ({ ...option, active: option === activeOption }));

	return (
		<div
			className="group relative"
			onFocus={() => setOverlayVisible(true)}
			onBlur={({ currentTarget, relatedTarget }) => {
				if (currentTarget.contains(relatedTarget)) return;
				setOverlayVisible(false);
			}}
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
				<span
					className={twMerge(
						"px-4 py-2",
						!activeOption?.label && "text-black-50 dark:text-white-50"
					)}
				>
					{activeOption?.label || placeholder}
				</span>
			</button>
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
							options={options}
							onOptionClick={({ option, currentTarget }) => {
								props.onChange(option.key as K);
								currentTarget.blur();
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
