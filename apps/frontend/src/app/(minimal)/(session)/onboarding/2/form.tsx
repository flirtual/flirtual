"use client";

import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "~/api";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Slider } from "~/components/inputs/slider";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { excludeBy, filterBy } from "~/utilities";

import type { AttributeCollection } from "~/api/attributes";
import type { FC } from "react";

const absMinAge = 18;
const absMaxAge = 60;

export interface Onboarding1FormProps {
	genders: AttributeCollection<"gender">;
}

export const Onboarding1Form: FC<Onboarding1FormProps> = ({ genders }) => {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	if (!session) return null;
	const { preferences } = session.user.profile;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				gender: filterBy(preferences?.attributes ?? [], "type", "gender").map(
					({ id }) => id
				),
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				]
			}}
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				await Promise.all([
					api.user.profile.updatePreferences(session.user.id, {
						query: {
							requiredAttributes: ["gender"]
						},
						body: {
							agemin: agemin === absMinAge ? null : agemin,
							agemax: agemax === absMaxAge ? null : agemax,
							attributes: [
								...excludeBy(
									preferences?.attributes ?? [],
									"type",
									"gender"
								).map(({ id }) => id),
								...values.gender
							]
						}
					})
				]);

				await mutateSession();
				router.push(urls.browse());
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<>
								<InputCheckboxList
									{...field.props}
									items={genders.map((gender) => ({
										key: gender.id,
										label:
											gender.name === "Other"
												? "Other genders"
												: (gender.metadata?.plural ?? gender.name)
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="age">
						{({ labelProps, props: { value, onChange, ...props } }) => {
							const [min, max] = value;

							return (
								<>
									<InputLabel
										{...labelProps}
										hint={
											min === absMinAge && max === absMaxAge
												? "any age"
												: max === absMaxAge
													? `${min}+`
													: `${min}-${max}`
										}
									>
										Age range
									</InputLabel>
									<Slider
										{...props}
										max={absMaxAge}
										min={absMinAge}
										value={value}
										onValueChange={onChange}
									/>
								</>
							);
						}}
					</FormField>
					<div className="flex gap-2 desktop:flex-row-reverse">
						<FormButton className="w-36" size="sm">
							Finish
						</FormButton>
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75 desktop:flex-row-reverse"
							href={urls.onboarding(1)}
							kind="tertiary"
							size="sm"
						>
							<span>Back</span>
							<MoveRight className="size-5 shrink-0 desktop:rotate-180" />
						</ButtonLink>
					</div>
				</>
			)}
		</Form>
	);
};
