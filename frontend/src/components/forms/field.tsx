import { twMerge } from "tailwind-merge";

import { FormFieldsDefault, InputFormField, useFormContext } from "~/hooks/use-input-form";

import { FormInputMessages } from "./input-messages";

export type FormFieldProps<K extends keyof T, T extends FormFieldsDefault> = Omit<
	React.ComponentProps<"div">,
	"children"
> & {
	name: K;
	children: (field: InputFormField<T, K>) => React.ReactNode;
};

export type FormFieldFC<T extends FormFieldsDefault> = <K extends keyof T>(
	props: FormFieldProps<K, T>
) => JSX.Element;

export function FormField<K extends keyof T, T extends FormFieldsDefault>({
	name,
	children,
	...props
}: FormFieldProps<K, T>) {
	const form = useFormContext<T>();
	const field = form.fields[name];

	return (
		<div {...props} className={twMerge("flex flex-col gap-2", props.className)}>
			{children(field)}
			<FormInputMessages messages={field.errors} />
		</div>
	);
}
