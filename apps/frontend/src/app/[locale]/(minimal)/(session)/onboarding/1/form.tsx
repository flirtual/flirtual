import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { isWretchError } from "~/api/common";
import { User } from "~/api/user";
import { Profile } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputDateSelect,
	InputLabel,
	InputLabelHint
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { InputCountrySelect } from "~/components/inputs/specialized";
import { InputGeolocation } from "~/components/inputs/specialized/geolocation-input";
import { InputTimezoneSelect } from "~/components/inputs/specialized/timezone-select";
import { endOfYear, toLocalDateString } from "~/date";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import type { AttributeTranslation } from "~/hooks/use-attribute";
import { useConfig } from "~/hooks/use-config";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { useOptimisticRoute } from "~/preload";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

export const Onboarding1Form: FC = () => {
	const { user } = useSession();
	const { profile } = user;

	const { t } = useTranslation();
	const navigate = useNavigate();
	const toasts = useToast();

	const { country } = useConfig();

	const genders = useAttributes("gender");

	const tAttribute = useAttributeTranslation();

	useOptimisticRoute(urls.onboarding(2));

	return (
		<Form
			fields={{
				bornAt: user.bornAt
					? new Date(user.bornAt.replaceAll("-", "/"))
					: new Date(),
				country: user.profile.country ?? country ?? null,
				timezone: (profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone) as string | null,
				gender: profile.attributes.gender || []
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async ({ bornAt, ...values }) => {
				await Promise.all([
					User.update(user.id, {
						bornAt: toLocalDateString(bornAt),
						required: ["bornAt"]
					}),
					Profile.update(user.id, {
						country: values.country ?? "none",
						timezone: values.timezone ?? "none",
						genderId: values.gender?.filter((id) => id !== "other")
					})
				])
					.then(async () => {
						await invalidate({ queryKey: sessionKey() });
						navigate(urls.onboarding(2));
					})
					.catch((reason) => {
						if (isWretchError(reason) && reason.json?.error === "banned_underage") {
							window.location.href = urls.underage;
							return;
						}
						throw reason;
					});
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="bornAt">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									className="flex-col desktop:flex-row"
								>
									{t("date_of_birth")}
								</InputLabel>
								<InputDateSelect
									{...field.props}
									disabled={!!user.bornAt && !!user.tags?.includes("dob_locked")}
									max={endOfYear()}
									min={new Date("1900/01/01")}
									onDisabledClick={() => toasts.add({ type: "warning", value: t("dob_contact_to_correct") })}
								/>
							</>
						)}
					</FormField>
					<FormField name="gender">
						{(field) => {
							const simpleGenders = genders.filter((gender) => gender.simple);
							const simpleGenderIds = new Set(
								simpleGenders.map((gender) => gender.id)
							);
							const checkboxValue = field.props.value?.some(
								(id) => !simpleGenderIds.has(id) && id !== "other"
							)
								? [...field.props.value, "other"]
								: field.props.value;

							return (
								<>
									<InputLabel {...field.labelProps}>{t("my_gender")}</InputLabel>
									<InputCheckboxList
										{...field.props}
										items={[
											...simpleGenders.map((gender) => ({
												conflicts: gender.conflicts ?? [],
												key: gender.id,
												label: tAttribute[gender.id]?.name ?? gender.id
											})),
											{
												key: "other",
												label: t("other_genders")
											}
										]}
										value={checkboxValue ?? []}
									/>
									{checkboxValue?.includes("other") && (
										<InputAutocomplete
											{...field.props}
											options={genders.map((gender) => {
												const { name, definition }
													= (tAttribute[
														gender.id
													] as AttributeTranslation<"gender">) ?? {};

												return {
													definition,
													definitionLink: gender.definitionLink,
													hidden: simpleGenderIds.has(gender.id),
													key: gender.id,
													label: name ?? gender.id
												};
											})}
											limit={4}
											placeholder={t("select_genders")}
											value={field.props.value || []}
										/>
									)}
								</>
							);
						}}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel hint={t("optional")}>{t("country")}</InputLabel>
								<InputCountrySelect {...field.props} prefer={country ?? "us"} />
							</>
						)}
					</FormField>
					<div className="flex flex-col gap-2">
						<InputLabel hint={t("optional")}>{t("geolocation")}</InputLabel>
						<InputLabelHint className="-mt-2">
							{t("geolocation_hint")}
						</InputLabelHint>
						<InputGeolocation />
					</div>
					<FormField name="timezone">
						{(field) => (
							<>
								<InputLabel hint={t("optional")}>{t("timezone")}</InputLabel>
								<InputLabelHint className="-mt-2">
									{t("timezone_hint")}
								</InputLabelHint>
								<InputTimezoneSelect {...field.props} />
							</>
						)}
					</FormField>
					<FormButton className="ml-auto min-w-36" size="sm" />
				</>
			)}
		</Form>
	);
};
