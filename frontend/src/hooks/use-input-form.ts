import React, { createContext, useContext, useId, useMemo, useRef, useState } from "react";

import { FormFieldFC, FormField } from "~/components/forms/field";
import { entries } from "~/utilities";

export interface FormFieldsDefault {
	[s: string]: unknown;
}

export type InputFormSubmitFunction<T extends FormFieldsDefault> = (
	values: T,
	form: UseInputForm<T>,
	event: React.FormEvent<HTMLFormElement>
) => Promise<void>;

export interface InputFormOptions<T extends FormFieldsDefault> {
	onSubmit: InputFormSubmitFunction<T>;
	fields: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyInputFormOptions = InputFormOptions<any>;

export interface InputProps<K, V> {
	id: string;
	name: K;
	value: V;
	disabled: boolean;
	onChange: React.Dispatch<V>;
}

export type FieldErrors<T> = { [K in keyof T]?: Array<string> };

export interface InputFormField<T, K extends keyof T> {
	props: InputProps<K, T[K]>;
	changed: boolean;
	labelProps: { htmlFor: string };
	errors: Array<string>;
}

export interface UseInputForm<T extends FormFieldsDefault> {
	fields: { [K in keyof T]: InputFormField<T, K> };
	errors: Array<string>;
	props: React.ComponentProps<"form">;
	submitting: boolean;
	FormField: FormFieldFC<T>;
	setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors<T>>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormContext = createContext<UseInputForm<any> | null>(null);

export function useFormContext<T extends FormFieldsDefault>() {
	const form = useContext(FormContext);
	if (!form) throw new Error("Missing form context");

	return form as UseInputForm<T>;
}

export function useInputForm<T extends { [s: string]: unknown }>(
	options: InputFormOptions<T>
): UseInputForm<T> {
	const { onSubmit } = options;
	const formId = useId();

	const { current: initialFields } = useRef(options.fields);

	const [values, setValues] = useState(initialFields);
	const [errors, setErrors] = useState<Array<string>>([]);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({});

	const [submitting, setSubmitting] = useState(false);

	const props: UseInputForm<T>["props"] = {
		onSubmit: async (event) => {
			event.preventDefault();
			setSubmitting(true);

			await onSubmit(values, form, event)
				.then(() => {
					setFieldErrors({});
					setErrors([]);
					return;
				})
				.catch((reason) => {
					if ("properties" in reason) return setFieldErrors(reason.properties);
					setErrors([reason.message]);
				});

			setSubmitting(false);
		}
	};

	const fields: UseInputForm<T>["fields"] = useMemo(
		() =>
			Object.fromEntries(
				entries(values).map(([key, value]) => {
					const id = `${formId}-${String(key)}`;
					const props: InputProps<unknown, unknown> = {
						id,
						name: key,
						value,
						disabled: submitting,
						onChange: (value) => setValues((values) => ({ ...values, [key]: value }))
					};

					return [
						key,
						{
							props,
							changed: value !== initialFields[key],
							labelProps: { htmlFor: id },
							errors: fieldErrors[key] ?? []
						}
					];
				})
			) as UseInputForm<T>["fields"],
		[formId, fieldErrors, submitting, initialFields, values]
	);

	const form = {
		fields,
		errors,
		props,
		submitting,
		FormField,
		setFieldErrors
	};

	return form;
}
