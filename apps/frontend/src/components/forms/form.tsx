import { useCallback, useRef } from "react";
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
	form: { Captcha: () => React.ReactNode | null } & UseInputForm<T>
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

export function Form<T extends { [s: string]: unknown }>(props: FormProps<T>) {
	const captchaReference = useRef<FormCaptchaReference>(null);

	props = Object.assign({ formErrorMessages: true, renderCaptcha: true }, props);
	const form = useInputForm({ ...props, captchaRef: captchaReference });

	const CaptchaWithReference = useCallback(() => {
		if (!props.withCaptcha) return null;

		return (<FormCaptcha ref={captchaReference} tabIndex={props.captchaTabIndex} />);
	}, [props.captchaTabIndex, props.withCaptcha]);

	const children
		= typeof props.children === "function"
			? props.children({
					...form,
					Captcha: CaptchaWithReference
				})
			: props.children;

	return (
		<form
			{...form.props}
			{...omit(props, [
				"fields",
				"onSubmit",
				"formErrorMessages",
				"requireChange",
				"renderCaptcha",
				"captchaTabIndex",
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
				{props.renderCaptcha && <CaptchaWithReference />}
			</FormContext>
		</form>
	);
}
