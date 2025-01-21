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
	form: { Captcha: () => React.ReactNode | null } & UseInputForm<T>
) => React.ReactNode;

export type FormChildren<T extends FormFieldsDefault> =
	| Array<React.ReactNode>
	| FormChildrenFunction<T>;

export type FormProps<T extends FormFieldsDefault> = {
	children: FormChildren<T>;
	formErrorMessages?: boolean;
	renderCaptcha?: boolean;
} &
Omit<InputFormOptions<T>, "captchaRef"> & Omit<
	React.ComponentProps<"form">,
	"children" | "onSubmit"
>;

export function Form<T extends { [s: string]: unknown }>(props: FormProps<T>) {
	const captchaReference = useRef<FormCaptchaReference>(null);

	props = Object.assign({ formErrorMessages: true, renderCaptcha: true }, props);
	const form = useInputForm({ ...props, captchaRef: captchaReference });

	const captcha = props.withCaptcha && (
		<div className="flex flex-col gap-2">
			<FormCaptcha ref={captchaReference} tabIndex={props.captchaTabIndex} />
			<FormInputMessages
				className="desktop:mx-auto desktop:w-fit desktop:text-center"
				messages={form.fields.captcha?.errors.map((value) => ({ type: "error", value }))}
			/>
		</div>
	);

	const children
		= typeof props.children === "function"
			? props.children({
				...form,
				Captcha: () => captcha
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
				{props.renderCaptcha && captcha}
			</FormContext>
		</form>
	);
}
