import { useRef } from "react";
import { omit } from "remeda";

import {
	FormContext,

	useInputForm

} from "~/hooks/use-input-form";
import type { FormFieldsDefault, InputFormOptions, UseInputForm } from "~/hooks/use-input-form";

import { FormCaptcha } from "./captcha";
import type { FormCaptchaReference } from "./captcha";
import { FormInputMessages } from "./input-messages";

export type FormChildrenFunction<T extends FormFieldsDefault> = (
	form: { captchaWidget: React.ReactNode } & UseInputForm<T>
) => React.ReactNode;

export type FormChildren<T extends FormFieldsDefault>
	= | Array<React.ReactNode>
		| FormChildrenFunction<T>;

export type FormProps<T extends FormFieldsDefault> = {
	children: FormChildren<T>;
	formErrorMessages?: boolean;
	renderCaptcha?: boolean;
}
& Omit<InputFormOptions<T>, "captchaRef"> & Omit<
	React.ComponentProps<"form">,
		"children" | "onSubmit"
>;

export function Form<T extends { [s: string]: unknown }>({ formErrorMessages = true, renderCaptcha = true, ...props }: FormProps<T>) {
	const captchaReference = useRef<FormCaptchaReference>(null);
	const form = useInputForm({ ...props, captchaRef: captchaReference });

	const captchaWidget = props.withCaptcha
		? <FormCaptcha ref={captchaReference} tabIndex={props.captchaTabIndex} />
		: null;

	const children
		= typeof props.children === "function"
			? props.children({ ...form, captchaWidget })
			: props.children;

	return (
		<form
			{...form.props}
			{...omit(props, [
				"fields",
				"onSubmit",
				"requireChange",
				"captchaTabIndex",
				"withCaptcha",
				"withGlobalId"
			])}
		>
			<FormContext value={form}>
				{children}
				{formErrorMessages && (
					<FormInputMessages
						messages={form.errors.map((value) => ({ type: "error", value }))}
					/>
				)}
				{renderCaptcha && captchaWidget}
			</FormContext>
		</form>
	);
}
