"use client";

import { MoveLeft } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useRouter } from "~/i18n/navigation";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

const absMinAge = 18;
const absMaxAge = 60;

export const Onboarding2Form: FC = () => {
	const { user } = useSession();
	const { preferences } = user.profile;

	const router = useRouter();

	const genders = useAttributes("gender").filter(
		({ simple, fallback }) => simple || fallback
	);

	const t = useTranslations();
	const tAttribute = useAttributeTranslation();

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

				await Profile.updatePreferences(user.id, {
					requiredAttributes: ["gender"],
					agemin: agemin === absMinAge ? null : agemin,
					agemax: agemax === absMaxAge ? null : agemax,
					attributes: [
						...Object.values(preferenceAttributes).flat().filter(Boolean),
						...values.gender
					]
				});

				await invalidate({ queryKey: sessionKey() });
				router.push(urls.discover("dates"));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>
									{t("im_interested_in")}
								</InputLabel>
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
												? t("other_genders")
												: (plural ?? name)
										};
									})}
								/>
							</>
						)}
					</FormField>
					<FormField name="age">
						{({ labelProps, props: { value, onChange, ...props } }) => {
							const [min, max] = value as [number, number];

							return (
								<>
									<InputLabel
										{...labelProps}
										hint={
											min === absMinAge && max === absMaxAge
												? t("any_age")
												: max === absMaxAge
													? t("number_plus", { number: min })
													: min === max
														? min
														: t("number_range", { from: min, to: max })
										}
									>
										{t("age_range")}
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
							<span>{t("back")}</span>
						</ButtonLink>
						<FormButton className="min-w-36" size="sm">{t("finish")}</FormButton>
					</div>
				</>
			)}
		</Form>
	);
};
