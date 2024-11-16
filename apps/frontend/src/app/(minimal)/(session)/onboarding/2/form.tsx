"use client";

import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FC } from "react";

import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Slider } from "~/components/inputs/slider";
import {
	type AttributeTranslation,
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

const absMinAge = 18;
const absMaxAge = 60;

export const Onboarding2Form: FC = () => {
	const [session, mutateSession] = useSession();
	const router = useRouter();

	const genders = useAttributes("gender").filter(
		({ simple, fallback }) => simple || fallback
	);

	const tAttribute = useAttributeTranslation();

	if (!session) return null;
	const { preferences } = session.user.profile;

	return (
		<Form
			fields={{
				gender: preferences?.attributes.gender || [],
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				]
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				const { gender: _, ...preferenceAttributes }
					= preferences?.attributes ?? {};

				await Profile.updatePreferences(session.user.id, {
					requiredAttributes: ["gender"],
					agemin: agemin === absMinAge ? null : agemin,
					agemax: agemax === absMaxAge ? null : agemax,
					attributes: [
						...Object.values(preferenceAttributes).flat().filter(Boolean),
						...values.gender
					]
				});

				await mutateSession();
				router.push(urls.browse());
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<InputCheckboxList
								{...field.props}
								items={genders.map((gender) => {
									const { name, plural } = (tAttribute[
										gender.id
									] as AttributeTranslation<"gender">) ?? {
										name: gender.id
									};

									return {
										key: gender.id,
										label: gender.fallback
											? "Other genders"
											: (plural ?? name)
									};
								})}
							/>
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
					<div className="ml-auto flex gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.onboarding(1)}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5 shrink-0" />
							<span>Back</span>
						</ButtonLink>
						<FormButton className="w-36" size="sm">
							Finish
						</FormButton>
					</div>
				</>
			)}
		</Form>
	);
};
