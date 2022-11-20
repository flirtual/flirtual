"use client";

import { api } from "~/api";
import { FormField } from "~/components/forms/field";
import { FormInputMessages } from "~/components/forms/input-messages";
import { InputAutocomplete, InputCheckbox, InputDateSelect, InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useInputForm } from "~/hooks/use-input-form";

export const Onboarding2Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	console.log(user);

	const { fields, formProps, formErrors } = useInputForm<{
		bornAt: Date;
		sexuality: Array<string>;
		gender: Array<string>;
	}>({
		fields: {
			bornAt: user?.bornAt ? new Date(user.bornAt) : new Date(),
			gender: user?.profile.gender ?? [],
			sexuality: user?.profile.sexuality ?? []
		},
		onSubmit: async (values) => {
			const { sexuality, gender } = values;
			if (!user) return;

			await api.user.update(user.id, { bornAt: values.bornAt.toISOString() });
			await api.profile.update(user.id, { sexuality, gender });
		}
	});

	return (
		<form {...formProps} className="flex flex-col gap-8">
			<FormField field={fields.bornAt}>
				{(field) => (
					<>
						<InputLabel
							{...field.labelProps}
							className="flex-col sm:flex-row"
							hint="(only your age will be visible)"
						>
							Date of birth
						</InputLabel>
						<InputDateSelect {...field.props} />
					</>
				)}
			</FormField>
			<FormField field={fields.gender}>
				{(field) => (
					<>
						<InputLabel {...field.labelProps}>Gender</InputLabel>
						<InputCheckboxList
							{...field.props}
							items={[
								{ key: "man", label: "Man" },
								{ key: "woman", label: "Woman" },
								{ key: "other", label: "Other" }
							]}
						/>
					</>
				)}
			</FormField>
			<FormField field={fields.sexuality}>
				{(field) => (
					<>
						<InputLabel>Sexuality</InputLabel>
						<InputAutocomplete
							{...field.props}
							placeholder="Select your sexualities..."
							options={[
								"Straight",
								"Lesbian",
								"Gay",
								"Bisexual",
								"Pansexual",
								"Asexual",
								"Demisexual",
								"Heteroflexible",
								"Homoflexible",
								"Queer",
								"Questioning",
								"Experimenting in VR"
							].map((label) => ({ label, key: label.toLowerCase().replace(" ", "_") }))}
						/>
					</>
				)}
			</FormField>
			<button
				className="rounded-xl bg-brand-gradient p-4 shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-brand-coral focus:ring-offset-2"
				type="submit"
			>
				<span className="font-montserrat text-xl font-bold text-white">Continue</span>
			</button>
			<FormInputMessages messages={formErrors} />
		</form>
	);
};
