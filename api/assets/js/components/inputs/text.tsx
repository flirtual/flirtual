import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import React, { useRef } from "react";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "../icons";

import { omit } from "~/utilities";

export type TextProps = React.ComponentProps<"input"> & { Icon?: IconComponent };

export const Text: React.FC<TextProps> = (props) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const Icon = props.Icon ?? props.type === "date" ? CalendarDaysIcon : undefined;

	return (
		<div
			className="bg-brand-grey shadow-brand-1 focus-within:ring-brand-coral overflow-hidden flex items-center focus-within:ring-offset-2 rounded-xl focus-within:ring-2"
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
					"w-full bg-transparent border-none text-xl font-nunito focus:outline-none focus:ring-0 px-4 py-2",
					Icon && "pl-2",
					props.className
				)}
			/>
		</div>
	);
};
