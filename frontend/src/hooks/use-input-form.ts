import React, { useId, useState } from "react";

type InputFormSubmitFunction<T> = (
	values: T,
	event: React.FormEvent<HTMLFormElement>
) => Promise<void>;

interface UseInputFormOptions<T> {
	onSubmit: InputFormSubmitFunction<T>;
	fields: T;
}

interface InputProps<K, V> {
	id: string;
	name: K;
	value: V;
	onChange: React.Dispatch<V>;
}

type InputErrors<T> = { [K in keyof T]?: Array<string> };

export interface InputFormField<T, K extends keyof T> {
	props: InputProps<K, T[K]>;
	labelProps: { htmlFor: string };
	errors: Array<string>;
}

export interface UseInputForm<T> {
	fields: { [K in keyof T]: InputFormField<T, K> };
	formErrors: Array<string>;
	formProps: React.ComponentProps<"form">;
}

export function useInputForm<T extends { [s: string]: unknown }>(
	options: UseInputFormOptions<T>
): UseInputForm<T> {
	const formId = useId();

	const [values, setValues] = useState(options.fields);
	const [formErrors, setFormErrors] = useState<Array<string>>([]);
	const [inputErrors, setInputErrors] = useState<InputErrors<T>>({});

	return {
		fields: Object.fromEntries(
			Object.entries(values).map(([key, value]) => {
				const id = `${formId}-${key}`;
				const props = {
					id,
					name: key,
					value,
					onChange: (value) => setValues((values) => ({ ...values, [key]: value }))
				} as InputProps<unknown, unknown>;

				return [
					key,
					{
						props,
						labelProps: { htmlFor: id },
						errors: inputErrors[key] ?? []
					}
				];
			})
		) as UseInputForm<T>["fields"],
		formErrors,
		formProps: {
			onSubmit: async (event) => {
				event.preventDefault();

				await options
					.onSubmit(values, event)
					.then(() => {
						setInputErrors({});
						setFormErrors([]);
						return;
					})
					.catch((reason) => {
						if ("properties" in reason) return setInputErrors(reason.properties);
						setFormErrors([reason.message]);
					});
			}
		}
	};
}
