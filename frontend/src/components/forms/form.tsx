import React, { useRef } from "react";

import {
	useInputForm,
	UseInputForm,
	FormContext,
	InputFormOptions,
	FormFieldsDefault
} from "~/hooks/use-input-form";
import { omit } from "~/utilities";

import { FormCaptcha, FormCaptchaRef } from "./captcha";
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
	Omit<InputFormOptions<T>, "captchaRef"> & {
		children: FormChildren<T>;
		formErrorMessages?: boolean;
	};

export function Form<T extends { [s: string]: unknown }>(props: FormProps<T>) {
	const captchaRef = useRef<FormCaptchaRef>(null);

	props = Object.assign({ formErrorMessages: true }, props);
	const form = useInputForm({ ...props, captchaRef });

	const children = typeof props.children === "function" ? props.children(form) : props.children;

	return (
		<form
			{...form.props}
			{...omit(props, ["fields", "onSubmit", "formErrorMessages", "requireChange", "withCaptcha"])}
		>
			<FormContext.Provider value={form}>
				{children}
				{props.formErrorMessages && <FormInputMessages messages={form.errors} />}
				{props.withCaptcha && <FormCaptcha ref={captchaRef} />}
			</FormContext.Provider>
		</form>
	);
}
