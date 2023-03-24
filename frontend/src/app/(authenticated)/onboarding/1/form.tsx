"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputLabel,
	InputRangeSlider,
	InputRangeSliderValue,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useSessionUser } from "~/hooks/use-session";
import { urls } from "~/urls";
import { excludeBy, filterBy } from "~/utilities";

const absMinAge = 18;
const absMaxAge = 100;

export const Onboarding1Form: React.FC = () => {
	const user = useSessionUser();
	const router = useRouter();

	const genders = useAttributeList("gender")
		.filter((gender) => gender.metadata?.simple)
		.sort((a, b) => ((a.metadata?.order ?? 0) > (b.metadata?.order ?? 0) ? 1 : -1));

	if (!user) return null;
	const { preferences } = user.profile;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				gender: filterBy(preferences?.attributes ?? [], "type", "gender").map(({ id }) => id),
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				] satisfies InputRangeSliderValue,
				serious: user.profile.serious ?? false
			}}
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				await Promise.all([
					api.user.profile.update(user.id, {
						query: {
							required: ["serious"]
						},
						body: {
							serious: values.serious
						}
					}),
					api.user.profile.updatePreferences(user.id, {
						query: {
							requiredAttributes: ["gender"]
						},
						body: {
							agemin: agemin === absMinAge ? null : agemin,
							agemax: agemax === absMaxAge ? null : agemax,
							attributes: [
								...excludeBy(preferences?.attributes ?? [], "type", "gender").map(({ id }) => id),
								...values.gender
							]
						}
					})
				]);

				router.push(urls.onboarding(2));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>I want to meet...</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={genders.map((gender) => ({
										key: gender.id,
										label: gender.metadata?.plural ?? gender.name
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="age">
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
					<FormField className="flex-col-reverse gap-4 sm:flex-row sm:items-center" name="serious">
						{(field) => (
							<>
								<InputSwitch {...field.props} />
								<InputLabel {...field.labelProps} inline>
									Are you open to serious dating?
								</InputLabel>
							</>
						)}
					</FormField>
					<FormButton>Next page</FormButton>
				</>
			)}
		</Form>
	);
};
