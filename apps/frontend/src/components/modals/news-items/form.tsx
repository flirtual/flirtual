/* eslint-disable react-refresh/only-export-components */
import { createContext, use, useEffect, useRef } from "react";

import { Form } from "~/components/forms";
import type { FormProps } from "~/components/forms";
import type { FormFieldsDefault, UseInputForm } from "~/hooks/use-input-form";

export type NewsFormSubmit = () => Promise<boolean>;

export interface NewsFormRegistry {
	register: (submit: NewsFormSubmit | null) => void;
	onSaved: () => void;
}

export const NewsFormContext = createContext<NewsFormRegistry | null>(null);

function NewsFormRegistration<T extends FormFieldsDefault>({
	form
}: {
	form: UseInputForm<T>;
}) {
	const registry = use(NewsFormContext);
	const submit = useRef(form.submit);

	useEffect(() => {
		submit.current = form.submit;
	});

	useEffect(() => {
		if (!registry) return;

		registry.register(async () => {
			const { errors, fieldErrors } = await submit.current();

			return (
				errors.length === 0
				&& Object.values(fieldErrors).every((issues) => !issues?.length)
			);
		});

		return () => registry.register(null);
	}, [registry]);

	return null;
}

export function NewsForm<T extends FormFieldsDefault>({
	children,
	onSubmit,
	...props
}: FormProps<T>) {
	const registry = use(NewsFormContext);

	return (
		<Form
			{...props}
			onSubmit={async (values, form) => {
				await onSubmit(values, form);
				registry?.onSaved();
			}}
		>
			{(form) => (
				<>
					<NewsFormRegistration form={form} />
					{typeof children === "function" ? children(form) : children}
				</>
			)}
		</Form>
	);
}
