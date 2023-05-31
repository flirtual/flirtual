"use client";

import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { Dispatch, FC, useState } from "react";
import { twMerge } from "tailwind-merge";

import {
	focusElementByKeydown,
	InputOptionWindow,
	InputOptionWindowProps,
	InputSelectOption,
	OptionItemProps
} from "./option-window";

export interface InputSelectProps<T> {
	optional?: boolean;
	placeholder?: string;
	value: T;
	onChange: Dispatch<T>;
	options: Array<InputSelectOption<T>>;
	OptionListItem?: InputOptionWindowProps<T>["OptionItem"];
}

export function InputSelect<K>(props: InputSelectProps<K>) {
	const { placeholder = "Select an option", optional = false, OptionListItem } = props;
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
			onKeyDown={(event) => {
				const element = focusElementByKeydown(event);
				if (element) props.onChange(element.dataset.key as K);
			}}
		>
			<div className="focusable-within flex w-full items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20">
				<button
					className="flex items-center justify-center bg-brand-gradient p-2 text-white-20"
					type="button"
				>
					<ChevronUpDownIcon className="h-7 w-7" />
				</button>
				<div className="flex w-full justify-between gap-2 px-4 py-2" tabIndex={0}>
					<span
						className={twMerge(
							"w-full select-none text-left",
							!activeOption?.label && "text-black-50 dark:text-white-50"
						)}
					>
						{activeOption?.label || placeholder}
					</span>
					{optional && props.value !== null && (
						// @ts-expect-error: don't want to rewrite this.
						<button type="button" onClick={() => props.onChange(null)}>
							<XMarkIcon className="h-5 w-5" />
						</button>
					)}
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
							OptionItem={OptionListItem as FC<OptionItemProps<unknown>>}
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
