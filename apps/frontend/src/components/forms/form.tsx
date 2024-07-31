import { useRef } from "react";

import {
	useInputForm,
	type UseInputForm,
	FormContext,
	type InputFormOptions,
	type FormFieldsDefault
} from "~/hooks/use-input-form";
import { omit } from "~/utilities";

import { FormCaptcha, type FormCaptchaReference } from "./captcha";
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
	const captchaReference = useRef<FormCaptchaReference>(null);

	props = Object.assign({ formErrorMessages: true }, props);
	const form = useInputForm({ ...props, captchaRef: captchaReference });

	const children =
		typeof props.children === "function"
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
			<FormContext.Provider value={form}>
				{children}
				{props.formErrorMessages && (
					<FormInputMessages
						messages={form.errors.map((value) => ({ type: "error", value }))}
					/>
				)}
				{props.withCaptcha && <FormCaptcha ref={captchaReference} />}
			</FormContext.Provider>
		</form>
	);
}
