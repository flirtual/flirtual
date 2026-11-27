import { useSuspenseQuery } from "@tanstack/react-query";
import { MoveLeft } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { gendersOptions } from "~/api/data";
import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Slider } from "~/components/inputs/slider";
import { useSession } from "~/hooks/use-session";
import { useLocale, useNavigate } from "~/i18n";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

const absMinAge = 18;
const absMaxAge = 60;

export const Onboarding3Form: FC = () => {
	const { user } = useSession();
	const { preferences } = user.profile;

	const navigate = useNavigate();

	const [locale] = useLocale();
	const genders = useSuspenseQuery(gendersOptions({ locale })).data.filter(
		(gender) => gender.simple || gender.default
	);

	const { t } = useTranslation();

	return (
		<Form
			fields={{
				genders: preferences?.genders || [],
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				]
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				await Profile.updatePreferences(user.id, {
					required: ["genders"],
					agemin: agemin === absMinAge ? null : agemin,
					agemax: agemax === absMaxAge ? null : agemax,
					genders: values.genders
				});

				await invalidate({ queryKey: sessionKey() });
				navigate(urls.discover("dates"));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="genders">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>
									{t("im_interested_in")}
								</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={genders.map((gender) => {
										const { name, plural } = gender;

										return {
											key: gender.id,
											label: gender.default
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
												? t("number_range_plus", { from: min, to: max })
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
							href={urls.onboarding(2)}
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
