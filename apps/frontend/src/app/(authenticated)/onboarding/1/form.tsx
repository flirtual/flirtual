"use client";

import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { api } from "~/api";
import { AttributeCollection } from "~/api/attributes";
import { ProfileMonopolyLabel, ProfileMonopolyList } from "~/api/user/profile";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputLabel,
	InputRangeSlider,
	InputRangeSliderValue,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useSessionUser } from "~/hooks/use-session";
import { urls } from "~/urls";
import { excludeBy, filterBy } from "~/utilities";

const absMinAge = 18;
const absMaxAge = 100;

export interface Onboarding1FormProps {
	genders: AttributeCollection<"gender">;
}

export const Onboarding1Form: FC<Onboarding1FormProps> = ({ genders }) => {
	const user = useSessionUser();
	const router = useRouter();

	const [expanded, setExpanded] = useState(false);

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
				serious: user.profile.serious ?? false,
				monopoly: user.profile.monopoly
			}}
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				await Promise.all([
					api.user.profile.update(user.id, {
						query: {
							required: ["serious"]
						},
						body: {
							serious: values.serious,
							monopoly: values.monopoly ?? "none"
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
					<Button
						className="w-32"
						kind="secondary"
						size="sm"
						onClick={() => setExpanded((expanded) => !expanded)}
					>
						{expanded ? "Less ▲" : "More ▼"}
					</Button>
					{expanded && (
						<FormField name="monopoly">
							{(field) => (
								<InputSelect
									{...field.props}
									optional
									placeholder="Relationship type"
									options={ProfileMonopolyList.map((item) => ({
										key: item,
										label: ProfileMonopolyLabel[item]
									}))}
								/>
							)}
						</FormField>
					)}
					<FormButton>Next page</FormButton>
				</>
			)}
		</Form>
	);
};
