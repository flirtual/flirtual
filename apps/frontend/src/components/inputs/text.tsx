"use client";

import { CalendarDaysIcon, EyeIcon } from "@heroicons/react/24/outline";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import React, { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { omit } from "~/utilities";

import { IconComponent } from "../icons";

export type InputTextProps = Omit<React.ComponentProps<"input">, "onChange"> & {
	Icon?: IconComponent;
	onChange?: React.Dispatch<string>;
};

export const InputText: React.FC<InputTextProps> = (props) => {
	const inputReference = useRef<HTMLInputElement>(null);
	const [inputVisible, setInputVisible] = useState(props.type !== "password");

	const type = inputVisible
		? props.type === "date" || props.type === "password"
			? "text"
			: props.type || "text"
		: "password";

	const Icon =
		props.Icon ?? (props.type === "date" ? CalendarDaysIcon : undefined);
	const InputVisibleIcon = inputVisible ? EyeIcon : EyeSlashIcon;

	return (
		<div
			className="focusable-within flex items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20"
			onClick={() => inputReference.current?.focus()}
		>
			{Icon && (
				<div className="flex items-center justify-center bg-brand-gradient p-2 text-white-20">
					<Icon className="h-7 w-7" />
				</div>
			)}
			<input
				{...omit(props, ["type", "Icon"])}
				ref={inputReference}
				type={type}
				className={twMerge(
					"w-full border-none bg-transparent px-4 py-2 font-nunito caret-theme-2 placeholder:text-black-20 focus:outline-none focus:ring-0 disabled:text-black-20 dark:placeholder:text-white-50 dark:disabled:text-white-50",
					props.className
				)}
				onChange={(event) => {
					if (!props?.onChange) return;
					props.onChange(event.target.value);
				}}
			/>
			{props.type === "password" && (
				<button
					className="pr-4"
					type="button"
					onClick={() => setInputVisible((inputVisible) => !inputVisible)}
				>
					<InputVisibleIcon className="h-5 w-5" />
				</button>
			)}
		</div>
	);
};
