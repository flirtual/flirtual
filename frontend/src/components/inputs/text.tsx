"use client";

import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import React, { useRef } from "react";
import { twMerge } from "tailwind-merge";

import { omit } from "~/utilities";

import { IconComponent } from "../icons";

export type InputTextProps = Omit<React.ComponentProps<"input">, "onChange"> & {
	Icon?: IconComponent;
	onChange?: React.Dispatch<string>;
};

export const InputText: React.FC<InputTextProps> = (props) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const Icon = props.Icon ?? props.type === "date" ? CalendarDaysIcon : undefined;

	return (
		<div
			className="flex items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50"
			onClick={() => inputRef.current?.focus()}
		>
			{Icon && (
				<div className="flex items-center justify-center bg-brand-gradient p-2 text-white-20">
					<Icon className="h-7 w-7" />
				</div>
			)}
			<input
				{...omit(props, ["type", "Icon"])}
				ref={inputRef}
				type={props.type === "date" ? "text" : props.type || "text"}
				className={twMerge(
					"w-full border-none bg-transparent px-4 py-2 font-nunito text-xl focus:outline-none focus:ring-0",
					Icon && "pl-2",
					props.className
				)}
				onChange={(event) => {
					if (!props?.onChange) return;
					props.onChange(event.target.value);
				}}
			/>
		</div>
	);
};
