"use client";

import { forwardRef } from "react";

export type InputFileValue = Array<File>;

export type InputFileProps = Omit<
	React.ComponentProps<"input">,
	"onChange" | "value" | "type"
> & {
	onChange?: React.Dispatch<InputFileValue>;
};

export const InputFile = forwardRef<HTMLInputElement, InputFileProps>(
	({ onChange, ...props }, reference) => (
		<input
			{...props}
			ref={reference}
			type="file"
			onChange={({ currentTarget }) => {
				if (!onChange || !currentTarget.files) return;
				onChange([...currentTarget.files]);
			}}
		/>
	)
);
