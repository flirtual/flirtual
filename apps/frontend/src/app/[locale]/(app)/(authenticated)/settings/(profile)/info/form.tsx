import { useSuspenseQueries } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { fromEntries } from "remeda";

import { isWretchError } from "~/api/common";
import { platformsOptions, sexualitiesOptions } from "~/api/data";
import { User } from "~/api/user";
import { Profile } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { FormGameAutocomplete } from "~/components/forms/game-autocomplete";
import {
	InputAutocomplete,
	InputDateSelect,
	InputLabel,
	InputLabelHint,
	InputSwitch
} from "~/components/inputs";
import {
	InputCountrySelect,
	InputGenderSelect,
	InputGeolocation,
	InputLanguageAutocomplete,
	InputTimezoneSelect
} from "~/components/inputs/specialized";
import { endOfYear, toLocalDateString } from "~/date";
import { timezones, vrTags } from "~/features";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useLocale } from "~/i18n";
import { mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

const FormTypes = [
	...(["gender", "sexuality", "platform", "game"] as const)
];

export const InfoForm: FC = () => {
	const session = useOptionalSession();
	const toasts = useToast();

	const [locale] = useLocale();
	const [{ data: platforms }, { data: sexualities }] = useSuspenseQueries({
		queries: [platformsOptions({ locale }), sexualitiesOptions({ locale })]
	});

	const { t } = useTranslation();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			withGlobalId
			fields={{
				bornAt: user.bornAt
					? new Date(user.bornAt.replaceAll("-", "/"))
					: new Date(),
				new: profile.new ?? false,
				country: profile.country ?? null,
				timezone: profile.timezone ?? null,
				languages: profile.languages ?? [],
				gender: profile.genders || [],
				sexuality: profile.sexualities || [],
				platform: profile.platforms || [],
				game: profile.games || []
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ bornAt, country, timezone, ...values }) => {
				const result = await Promise.all([
					User.update(user.id, {
						bornAt: toLocalDateString(bornAt)
					}),
					Profile.update(user.id, {
						required: ["new"],
						country: country ?? null,
						timezone: timezone ?? null,
						languages: values.languages,
						new: values.new,
						...fromEntries(
							FormTypes.map((type) => {
								return [
									`${type}Id`,
									values[type]
								] as const;
							})
						)
					})
				]).catch((reason) => {
					if (isWretchError(reason) && reason.json?.error === "banned_underage") {
						window.location.href = urls.verifyAge;
						return;
					}
					throw reason;
				});

				if (!result) return;
				const [newUser, newProfile] = result;

				toasts.add(t("saved_info"));

				await mutate(sessionKey(), {
					...session,
					user: {
						...newUser,
						profile: {
							...newProfile
						}
					}
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
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>{t("gender")}</InputLabel>
								<InputGenderSelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel>{t("sexuality")}</InputLabel>
								<InputAutocomplete
									{...field.props}
									options={sexualities.map((sexuality) => {
										const { id, name, definition, definitionLink } = sexuality;

										return {
											key: id,
											label: name,
											definition,
											definitionLink
										};
									})}

									limit={3}
									placeholder={t("select_your_sexualities")}
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel>{t("country")}</InputLabel>
								<InputCountrySelect {...field.props} />
							</>
						)}
					</FormField>
					{timezones && (
						<FormField name="timezone">
							{(field) => (
								<>
									<InputLabel>{t("timezone")}</InputLabel>
									<InputLabelHint className="-mt-2">
										{t("timezone_hint")}
									</InputLabelHint>
									<InputTimezoneSelect {...field.props} />
								</>
							)}
						</FormField>
					)}
					<div className="flex flex-col gap-2">
						<InputLabel>{t("geolocation")}</InputLabel>
						<InputLabelHint className="-mt-2">
							{t("geolocation_hint")}
							<details>
								<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
									{t("privacy")}
								</summary>
								{t("geolocation_privacy_details")}
							</details>
						</InputLabelHint>
						<InputGeolocation />
					</div>
					<FormField name="languages">
						{(field) => (
							<>
								<InputLabel>{t("language")}</InputLabel>
								<InputLanguageAutocomplete limit={5} {...field.props} />
							</>
						)}
					</FormField>
					{vrTags && (
						<>
							<FormField name="platform">
								{(field) => (
									<>
										<InputLabel>{t("vr_setup")}</InputLabel>
										<InputAutocomplete
											{...field.props}
											options={platforms.map((platform) => {
												const { id, name, example } = platform;
												return {
													key: id,
													label: name,
													example
												};
											})}
											limit={8}
											placeholder={t("select_the_platforms_you_use")}
											value={field.props.value || []}
										/>
									</>
								)}
							</FormField>
							<FormField name="game">
								{() => (
									<>
										<InputLabel hint={t("up_to_number", { number: 5 })}>{t("vr_apps_games")}</InputLabel>
										<InputLabelHint className="-mt-2">
											{t("game_hint")}
										</InputLabelHint>
										<FormGameAutocomplete />
									</>
								)}
							</FormField>
							<FormField name="new">
								{(field) => (
									<>
										<InputLabel>{t("new_to_vr_question")}</InputLabel>
										<InputSwitch {...field.props} />
									</>
								)}
							</FormField>
						</>
					)}
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
