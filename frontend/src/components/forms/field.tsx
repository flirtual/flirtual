import { twMerge } from "tailwind-merge";

import { InputFormField } from "~/hooks/use-input-form";

import { FormInputMessages } from "./input-messages";

export type FormFieldProps<T> = Omit<React.ComponentProps<"div">, "children"> & {
	field: T;
	children: (field: T) => React.ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormField<T extends InputFormField<any, any>>({
	field,
	children,
	...props
}: FormFieldProps<T>) {
	return (
		<div {...props} className={twMerge("flex flex-col gap-2", props.className)}>
			{children(field)}
			<FormInputMessages messages={field.errors} />
		</div>
	);
}
