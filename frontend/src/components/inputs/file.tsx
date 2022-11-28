"use client";

import { forwardRef } from "react";

export type InputFileValue = Array<File>;

export type InputFileProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> & {
	onChange?: React.Dispatch<InputFileValue>;
	value: InputFileValue;
};

export const InputFile = forwardRef<HTMLInputElement, InputFileProps>(
	({ value, onChange, ...props }, ref) => (
		<input
			{...props}
			ref={ref}
			type="file"
			onChange={({ currentTarget }) => {
				if (!onChange || !currentTarget.files) return;
				onChange(Array.from(currentTarget.files));
			}}
		/>
	)
);
