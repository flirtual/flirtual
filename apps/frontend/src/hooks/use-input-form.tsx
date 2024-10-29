import { createContext, useContext, useId, useMemo, useState } from "react";
import { WretchError } from "wretch/resolver";
import { useTranslations, type TranslationValues } from "next-intl";
import { camelCase } from "change-case";

import { type FormFieldFC, FormField } from "~/components/forms/field";
import { entries } from "~/utilities";
import { isWretchError } from "~/api/common";

import type { FormCaptchaReference } from "~/components/forms/captcha";
import type { ReactNode, RefObject } from "react";
import type React from "react";

export interface FormFieldsDefault {
	[s: string]: unknown;
}

export type InputFormSubmitFunction<T extends FormFieldsDefault> = (
	values: T,
	form: UseInputForm<T>
	//event: React.FormEvent<HTMLFormElement>
) => Promise<void>;

export interface InputFormOptions<T extends FormFieldsDefault> {
	requireChange?: boolean | Array<keyof T>;
	withCaptcha?: boolean;
	withGlobalId?: boolean;
	captchaRef: RefObject<FormCaptchaReference>;
	onSubmit: InputFormSubmitFunction<T>;
	submitOnChange?: boolean;
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
	captcha: string;
	errors: Array<string>;
	props: React.ComponentProps<"form">;
	buttonProps: React.ComponentProps<"button">;
	submitting: boolean;
	changes: Array<keyof T>;
	FormField: FormFieldFC<T>;
	setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors<T>>>;
	setErrors: React.Dispatch<React.SetStateAction<Array<string>>>;
	setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
	reset: (newValues: T | null) => void;
	submit: (values?: T) => Promise<{
		errors: Array<string>;
		fieldErrors: FieldErrors<T>;
		fields: T;
	}>;
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
	const {
		onSubmit,
		requireChange = false,
		withCaptcha = false,
		withGlobalId = false,
		// submitOnChange = false,
		captchaRef
	} = options;

	const reactId = useId();
	const formId = withGlobalId ? "" : reactId;
	const t = useTranslations();

	const [initialValues, setInitialValues] = useState(options.fields);
	const [values, setValues] = useState(initialValues);

	const [captcha, setCaptcha] = useState<string>("");

	const [errors, setErrors] = useState<Array<string>>([]);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({});
	const [submitting, setSubmitting] = useState(false);

	/* useEffect(() => {
		setValues(options.fields);
		setInitialValues(options.fields);
	}, [options.fields]); */

	// const deferredValues = useDeferredValue(values);

	const submit: UseInputForm<T>["submit"] = async (_values: T = values) => {
		setSubmitting(true);

		const captcha =
			withCaptcha && captchaRef.current
				? await captchaRef.current.getResponsePromise()
				: "";

		setCaptcha(captcha);

		setFieldErrors({});
		setErrors([]);

		const result = await onSubmit(_values, { ...form, captcha, submit })
			.then(() => {
				setFieldErrors({});
				setErrors([]);

				setInitialValues(_values);
				return { errors: [], fieldErrors: {}, fields: _values };
			})
			.catch((reason) => {
				if (isWretchError(reason, "invalid_properties")) {
					const { details: properties } = reason.json;

					const fieldErrors = Object.fromEntries(
						Object.entries(properties).map(
							([key, issues]) =>
								[
									camelCase(key),
									issues.map(({ error, details }) =>
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										t(`errors.${error}` as any, details as TranslationValues)
									)
								] as const
						)
					) as FieldErrors<T>;
					setFieldErrors(fieldErrors);

					return { errors: [], fieldErrors, fields: _values };
				}

				if (reason instanceof WretchError) {
					const { error } = reason.json ?? {};

					const errors = [
						t(
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							`errors.${error}` as any,
							reason.json.details as TranslationValues
						)
					];
					setErrors(errors);

					return { errors, fieldErrors: {}, fields: _values };
				}

				const errors = Array.isArray(reason)
					? [<span key={0}>{reason as ReactNode}</span>]
					: [reason.message];

				setErrors(errors);
				return { errors, fieldErrors: {}, fields: _values };
			});

		if (withCaptcha) captchaRef.current?.reset();
		setSubmitting(false);
		return result;
	};

	// useEffect(() => void submit(deferredValues), [deferredValues]);

	const props: UseInputForm<T>["props"] = {
		onSubmit: async (event) => {
			event.preventDefault();
			return submit();
		}
	};

	const fields: UseInputForm<T>["fields"] = useMemo(
		() =>
			Object.fromEntries(
				entries(values).map(([key, value]) => {
					const id = `${formId}${String(key)}`;
					const props: InputProps<unknown, unknown> = {
						disabled: submitting,
						id,
						name: key,
						onChange: (value) => {
							setValues((values) => ({ ...values, [key]: value }));
							// if (submitOnChange) void submit(newValues);
						},
						value
					};

					return [
						key,
						{
							changed: value !== initialValues[key],
							errors: fieldErrors[key] ?? [],
							labelProps: { htmlFor: id },
							props
						}
					];
				})
			) as UseInputForm<T>["fields"],
		[formId, fieldErrors, submitting, initialValues, values]
	);

	const changes = entries(fields)
		.filter(([, field]) => field.changed)
		.map(([name]) => name);

	const buttonProps: UseInputForm<T>["buttonProps"] = {
		disabled:
			submitting ||
			(requireChange
				? requireChange === true
					? changes.length === 0
					: requireChange.some((k) => !changes.includes(k))
				: false),
		type: "submit"
	};

	const reset: UseInputForm<T>["reset"] = (newValues) => {
		if (newValues) setInitialValues(newValues);
		setValues(newValues ?? initialValues);

		setErrors([]);
		setFieldErrors({});
		setSubmitting(false);
	};

	const form = {
		FormField,
		buttonProps,
		captcha,
		changes,
		errors,
		fields,
		props,
		reset,
		setFieldErrors,
		setErrors,
		setSubmitting,
		submit,
		submitting
	};

	return form;
}
