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
			className="bg-brand-grey shadow-brand-1 border-red-500 focus-within:ring-brand-coral overflow-hidden flex items-center focus-within:ring-offset-2 rounded-xl focus-within:ring-2"
			onClick={() => inputRef.current?.focus()}
		>
			{Icon && (
				<div className="bg-brand-gradient flex items-center justify-center p-2 text-white">
					<Icon className="w-7 h-7" />
				</div>
			)}
			<input
				{...omit(props, ["type", "Icon"])}
				ref={inputRef}
				type={props.type === "date" ? "text" : props.type || "text"}
				className={twMerge(
					"font-nunito w-full bg-transparent border-none text-xl focus:outline-none focus:ring-0 px-4 py-2",
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
