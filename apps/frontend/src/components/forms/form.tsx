/* eslint-disable react/prefer-destructuring-assignment */
import { useRef } from "react";
import { omit } from "remeda";

import {
	FormContext,
	type FormFieldsDefault,
	type InputFormOptions,
	useInputForm,
	type UseInputForm
} from "~/hooks/use-input-form";

import { FormCaptcha, type FormCaptchaReference } from "./captcha";
import { FormInputMessages } from "./input-messages";

export type FormChildrenFunction<T extends FormFieldsDefault> = (
	form: UseInputForm<T>
) => React.ReactNode;

export type FormChildren<T extends FormFieldsDefault> =
	| Array<React.ReactNode>
	| FormChildrenFunction<T>;

export type FormProps<T extends FormFieldsDefault> = {
	children: FormChildren<T>;
	formErrorMessages?: boolean;
} &
Omit<InputFormOptions<T>, "captchaRef"> & Omit<
	React.ComponentProps<"form">,
	"children" | "onSubmit"
>;

export function Form<T extends { [s: string]: unknown }>(props: FormProps<T>) {
	const captchaReference = useRef<FormCaptchaReference>(null);

	props = Object.assign({ formErrorMessages: true }, props);
	const form = useInputForm({ ...props, captchaRef: captchaReference });

	const children
		= typeof props.children === "function"
			? props.children(form)
			: props.children;

	return (
		<form
			{...form.props}
			{...omit(props, [
				"fields",
				"onSubmit",
				"formErrorMessages",
				"requireChange",
				"withCaptcha",
				"withGlobalId"
			])}
		>
			<FormContext value={form}>
				{children}
				{props.formErrorMessages && (
					<FormInputMessages
						messages={form.errors.map((value) => ({ type: "error", value }))}
					/>
				)}
				{props.withCaptcha && <FormCaptcha ref={captchaReference} />}
			</FormContext>
		</form>
	);
}
