import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { twMerge } from "tailwind-merge";

import {
	type FormFieldsDefault,
	type InputFormField,
	useFormContext
} from "~/hooks/use-input-form";

import { FormInputMessages } from "./input-messages";

export type FormFieldProps<
	K extends keyof T,
	T extends FormFieldsDefault
> = {
	name: K;
	children: (field: InputFormField<T, K>) => React.ReactNode;
} & Omit<React.ComponentProps<"div">, "children">;

export type FormFieldFC<T extends FormFieldsDefault> = <K extends keyof T>(
	props: FormFieldProps<K, T>
) => React.JSX.Element;

export function FormField<K extends keyof T, T extends FormFieldsDefault>({
	name,
	children,
	...props
}: FormFieldProps<K, T>) {
	const reference = useRef<HTMLDivElement>(null);
	const form = useFormContext<T>();
	const field = form.fields[name];

	const [searchParameters] = useSearchParams();
	const autofocus = searchParameters.get("af") === field.props.id;

	useEffect(() => {
		if (!autofocus) return;
		const timeout = setTimeout(() => {
			if (!reference.current) return;
			reference.current.scrollIntoView();
			reference.current.focus();
		}, 1);

		return () => clearTimeout(timeout);
	}, [autofocus]);

	return (
		<div
			{...props}
			className={twMerge("flex flex-col gap-2", props.className)}
			ref={reference}
		>
			{children(field)}
			<FormInputMessages
				messages={field.errors.map((value) => ({ type: "error", value }))}
			/>
		</div>
	);
}
