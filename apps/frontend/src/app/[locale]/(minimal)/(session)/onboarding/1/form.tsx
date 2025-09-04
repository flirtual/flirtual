import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { fromEntries } from "remeda";

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
import { endOfYear } from "~/date";
import {

	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import type { AttributeTranslation } from "~/hooks/use-attribute";
import { useConfig } from "~/hooks/use-config";
import { useSession } from "~/hooks/use-session";
import { useNavigate } from "~/i18n";
import { useOptimisticRoute } from "~/preload";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

const AttributeKeys = [...(["gender", "game", "interest"] as const)];

export const Onboarding1Form: FC = () => {
	const { user } = useSession();
	const { profile } = user;

	const { t } = useTranslation();
	const navigate = useNavigate();

	const { country } = useConfig();

	const games = useAttributes("game");
	const genders = useAttributes("gender");
	const interests = useAttributes("interest");

	const tAttribute = useAttributeTranslation();

	useOptimisticRoute(urls.onboarding(2));

	return (
		<Form
			fields={{
				bornAt: user.bornAt
					? new Date(user.bornAt.replaceAll("-", "/"))
					: new Date(),
				country: user.profile.country ?? country ?? null,
				game: profile.attributes.game || [],
				gender: profile.attributes.gender || [],
				interest: profile.attributes.interest || []
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async ({ bornAt, ...values }) => {
				await Promise.all([
					User.update(user.id, {
						bornAt: bornAt.toISOString(),
						required: ["bornAt"]
					}),
					Profile.update(user.id, {
						country: values.country ?? "none",
						...fromEntries(
							AttributeKeys.map((type) => {
								return [
									`${type}Id`,
									type === "gender"
										? values[type]?.filter((id) => id !== "other")
										: values[type]
								] as const;
							})
						)
					})
				]).finally(async () => {
					await invalidate({ queryKey: sessionKey() });
				});

				navigate(urls.onboarding(2));
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
									max={endOfYear()}
									min={new Date("1900/01/01")}
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
								<InputLabel hint={t("optional")}>{t("location")}</InputLabel>
								<InputCountrySelect {...field.props} prefer={country ?? "us"} />
							</>
						)}
					</FormField>
					<FormField name="game">
						{(field) => (
							<>
								<InputLabel hint={t("up_to_number", { number: 5 })}>{t("vr_apps_games")}</InputLabel>
								<InputLabelHint className="-mt-2">
									{t("game_hint")}
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									options={games.map((game) => ({
										key: game,
										label: tAttribute[game]?.name ?? game
									}))}
									limit={5}
									placeholder={t("select_games")}
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<FormField name="interest">
						{(field) => (
							<>
								<InputLabel hint={t("up_to_number", { number: 10 })}>{t("interests")}</InputLabel>
								<InputLabelHint className="-mt-2">
									{t("onboarding_interests_hint")}
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									options={interests
										.filter(
											(interest) =>
												interest.category === "iiCe39JvGQAAtsrTqnLddb"
										)
										.map((interest) => ({
											key: interest.id,
											label: tAttribute[interest.id]?.name ?? interest.id
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
									limit={10}
									placeholder={t("select_interests")}
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<FormButton className="ml-auto min-w-36" size="sm" />
				</>
			)}
		</Form>
	);
};
