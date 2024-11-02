"use client";

import { useRef } from "react";
import type React from "react";
import { twMerge } from "tailwind-merge";

export type InputTextAreaProps = {
	onChange?: React.Dispatch<string>;
} & Omit<
	React.ComponentProps<"textarea">,
	"onChange"
>;

export const InputTextArea: React.FC<InputTextAreaProps> = ({ onChange, ...props }) => {
	const elementReference = useRef<HTMLTextAreaElement>(null);

	return (
		<div
			data-vaul-no-drag
			className="focusable-within flex items-center overflow-hidden rounded-xl bg-white-40 p-4 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20"
			onClick={() => elementReference.current?.focus()}
		>
			<textarea
				{...props}
				className={twMerge(
					"w-full border-none bg-transparent p-0 font-nunito placeholder:text-black-20 focus:outline-none focus:ring-0 dark:placeholder:text-white-50",
					props.className
				)}
				ref={elementReference}
				onChange={(event) => {
					onChange?.(event.target.value);
				}}
			/>
		</div>
	);
};
