import React from "react";

import {
	useInputForm,
	UseInputForm,
	FormContext,
	InputFormOptions,
	FormFieldsDefault
} from "~/hooks/use-input-form";
import { omit } from "~/utilities";

import { FormInputMessages } from "./input-messages";

export type FormChildrenFunction<T extends FormFieldsDefault> = (
	form: UseInputForm<T>
) => React.ReactNode;

export type FormChildren<T extends FormFieldsDefault> =
	| FormChildrenFunction<T>
	| Array<React.ReactNode>;

export type FormProps<T extends FormFieldsDefault> = Omit<
	React.ComponentProps<"form">,
	"children" | "onSubmit"
> &
	InputFormOptions<T> & { children: FormChildren<T>; formErrorMessages?: boolean };

export function Form<T extends { [s: string]: unknown }>(props: FormProps<T>) {
	props = Object.assign({ formErrorMessages: true }, props);
	const form = useInputForm(props);

	const children = typeof props.children === "function" ? props.children(form) : props.children;

	return (
		<form {...form.props} {...omit(props, ["fields", "onSubmit", "formErrorMessages"])}>
			<FormContext.Provider value={form}>
				{children}
				{props.formErrorMessages && <FormInputMessages messages={form.errors} />}
			</FormContext.Provider>
		</form>
	);
}
