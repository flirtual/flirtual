import { InputFormField } from "~/hooks/use-input-form";

import { FormInputMessages } from "./input-messages";

export interface FormFieldProps<T> {
	field: T;
	children: (field: T) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormField<T extends InputFormField<any, any>>({
	field,
	children
}: FormFieldProps<T>) {
	return (
		<div className="flex flex-col gap-2">
			{children(field)}
			<FormInputMessages messages={field.errors} />
		</div>
	);
}
