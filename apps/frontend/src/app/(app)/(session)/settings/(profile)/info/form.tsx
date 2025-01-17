"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";
import { fromEntries } from "remeda";

import { User } from "~/api/user";
import { Profile } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputDateSelect,
	InputLabel,
	InputLabelHint,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import {
	InputCountrySelect,
	InputLanguageAutocomplete
} from "~/components/inputs/specialized";
import {
	type AttributeTranslation,
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

const AttributeKeys = [
	...(["gender", "sexuality", "platform", "game"] as const)
];

export const InfoForm: FC = () => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	const games = useAttributes("game");
	const platforms = useAttributes("platform");
	const sexualities = useAttributes("sexuality");
	const genders = useAttributes("gender");

	const t = useTranslations();
	const tAttribute = useAttributeTranslation();

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
				languages: profile.languages ?? [],
				gender: profile.attributes.gender || [],
				sexuality: profile.attributes.sexuality || [],
				platform: profile.attributes.platform || [],
				game: profile.attributes.game || []
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ bornAt, country, ...values }) => {
				const [newUser, newProfile] = await Promise.all([
					User.update(user.id, {
						bornAt: bornAt.toISOString()
					}),
					Profile.update(user.id, {
						required: ["new"],
						country: country ?? "none",
						languages: values.languages,
						new: values.new,
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
				]);

				toasts.add(t("awake_few_wren_skip"));

				await mutateSession({
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
									max="now"
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
									<InputLabel {...field.labelProps}>Gender</InputLabel>
									<InputCheckboxList
										{...field.props}
										items={[
											...simpleGenders.map((gender) => ({
												key: gender.id,
												label: tAttribute[gender.id]?.name ?? gender.id,
												conflicts: gender.conflicts ?? []
											})),
											{
												key: "other",
												label: "Other genders"
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
													key: gender.id,
													label: name ?? gender.id,
													definition,
													definitionLink: gender.definitionLink,
													hidden: simpleGenderIds.has(gender.id)
												};
											})}
											limit={4}
											placeholder="Select your genders..."
											value={field.props.value || []}
										/>
									)}
								</>
							);
						}}
					</FormField>
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel>Sexuality</InputLabel>
								<InputAutocomplete
									{...field.props}
									options={sexualities.map((sexuality) => {
										const { id, definitionLink } = typeof sexuality === "string" ? { id: sexuality } : sexuality;

										const { name, definition }
											= (tAttribute[
												id
											] as AttributeTranslation<"sexuality">) ?? {};

										return {
											key: id,
											label: name ?? id,
											definition,
											definitionLink
										};
									})}

									limit={3}
									placeholder="Select your sexualities..."
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel>Location</InputLabel>
								<InputCountrySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="languages">
						{(field) => (
							<>
								<InputLabel>Language</InputLabel>
								<InputLanguageAutocomplete {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="platform">
						{(field) => (
							<>
								<InputLabel>VR setup</InputLabel>
								<InputAutocomplete
									{...field.props}
									options={platforms.map((platform) => ({
										key: platform,
										label: tAttribute[platform]?.name ?? platform
									}))}
									limit={8}
									placeholder="Select the platforms you use..."
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<FormField name="game">
						{(field) => (
							<>
								<InputLabel hint="(up to 5)">VR apps/games</InputLabel>
								<InputLabelHint className="-mt-2">
									After matching on Flirtual, you can meet up in any social app
									or multiplayer game.
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									options={games.map((game) => ({
										key: game,
										label: tAttribute[game]?.name ?? game
									}))}
									limit={5}
									placeholder="Select your favorite games..."
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<FormField name="new">
						{(field) => (
							<>
								<InputLabel>Are you new to Virtual Reality?</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
