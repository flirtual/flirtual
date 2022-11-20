"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { FormField } from "~/components/forms/field";
import { FormInputMessages } from "~/components/forms/input-messages";
import {
	InputLabel,
	InputRangeSlider,
	InputRangeSliderValue,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useInputForm } from "~/hooks/use-input-form";

export const Onboarding1Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	const router = useRouter();

	const absMinAge = 18;
	const absMaxAge = 100;

	const { fields, formProps, formErrors } = useInputForm<{
		gender: Array<string>;
		ageRange: InputRangeSliderValue;
		serious: boolean;
	}>({
		fields: {
			gender: user?.profile.preferences.gender ?? [],
			ageRange: [
				user?.profile.preferences.agemin ?? absMinAge,
				user?.profile.preferences.agemax ?? absMaxAge
			],
			serious: false
		},
		onSubmit: async (values) => {
			if (!user) return;

			const [agemin, agemax] = values.ageRange;
			await api.profile.updatePreferences(user.id, {
				agemin: agemin === absMinAge ? null : agemin,
				agemax: agemax === absMaxAge ? null : agemax,
				gender: values.gender
			});

			router.push("/onboarding/2");
		}
	});

	return (
		<form {...formProps} className="flex flex-col gap-8">
			<FormField field={fields.gender}>
				{(field) => (
					<>
						<InputLabel {...field.labelProps}>I want to meet...</InputLabel>
						<InputCheckboxList
							{...field.props}
							items={[
								{ key: "men", label: "Men" },
								{ key: "women", label: "Women" },
								{ key: "other", label: "Other" }
							]}
						/>
					</>
				)}
			</FormField>
			<FormField field={fields.ageRange}>
				{(field) => {
					const [min, max] = field.props.value;

					return (
						<>
							<InputLabel
								{...field.labelProps}
								hint={min === absMinAge && max === absMaxAge ? "any age" : `${min} to ${max}`}
							>
								Age range
							</InputLabel>
							<InputRangeSlider {...field.props} max={absMaxAge} min={absMinAge} />
						</>
					);
				}}
			</FormField>
			<FormField
				className="flex-col-reverse gap-4 sm:flex-row sm:items-center"
				field={fields.serious}
			>
				{(field) => (
					<>
						<InputSwitch {...field.props} />
						<InputLabel {...field.labelProps} inline>
							Are you open to serious dating?
						</InputLabel>
					</>
				)}
			</FormField>
			<div className="flex flex-col gap-4">
				<button
					className="rounded-xl bg-brand-gradient p-4 text-center shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-coral focus:ring-offset-2"
					type="submit"
				>
					<span className="font-montserrat text-xl font-semibold text-white-10">Continue</span>
				</button>
			</div>
			<FormInputMessages messages={formErrors} />
		</form>
	);
};
