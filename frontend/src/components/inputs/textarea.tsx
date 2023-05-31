"use client";

import React, { useRef } from "react";
import { twMerge } from "tailwind-merge";

export type InputTextAreaProps = Omit<React.ComponentProps<"textarea">, "onChange"> & {
	onChange?: React.Dispatch<string>;
};

export const InputTextArea: React.FC<InputTextAreaProps> = (props) => {
	const elementRef = useRef<HTMLTextAreaElement>(null);

	return (
		<div
			className="focusable-within flex items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 dark:bg-black-60 dark:text-white-20"
			onClick={() => elementRef.current?.focus()}
		>
			<textarea
				{...props}
				ref={elementRef}
				className={twMerge(
					"w-full border-none bg-transparent p-4 font-nunito placeholder:text-black-20 focus:outline-none focus:ring-0 dark:placeholder:text-white-50",
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
