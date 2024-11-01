"use client";

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
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { fromEntries } from "~/utilities";
import { Profile } from "~/api/user/profile";
import { User } from "~/api/user";
import {
	useAttributes,
	useAttributeTranslation,
	type AttributeTranslation
} from "~/hooks/use-attribute";

import type { FC } from "react";

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

	const tAttribute = useAttributeTranslation();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			withGlobalId
			className="flex flex-col gap-8"
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

				toasts.add("Saved basic info");

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
									Date of birth
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
										value={checkboxValue ?? []}
										items={[
											...simpleGenders.map((gender) => ({
												key: gender.id,
												label: tAttribute[gender.id]?.name ?? gender.id,
												conflicts: gender.conflicts ?? []
											})),
											{
												key: "other",
												label: "Other"
											}
										]}
									/>
									{checkboxValue?.includes("other") && (
										<InputAutocomplete
											{...field.props}
											limit={4}
											placeholder="Select your genders..."
											value={field.props.value || []}
											options={genders.map((gender) => {
												const { name, definition } =
													(tAttribute[
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
									limit={3}

									placeholder="Select your sexualities..."
									value={field.props.value || []}
									options={sexualities.map((sexuality) => {
										const { id, definitionLink } = typeof sexuality === "string" ? { id: sexuality } : sexuality;
										
										const { name, definition } =
											(tAttribute[
												id
											] as AttributeTranslation<"sexuality">) ?? {};

										return {
											key: id,
											label: name ?? id,
											definition,
											definitionLink
										};
									})}
								/>
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
							{""}a
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
									limit={8}
									placeholder="Select the platforms you use..."
									value={field.props.value || []}
									options={platforms.map((platform) => ({
										key: platform,
										label: tAttribute[platform]?.name ?? platform
									}))}
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
									limit={5}
									placeholder="Select your favorite games..."
									value={field.props.value || []}
									options={games.map((game) => ({
										key: game,
										label: tAttribute[game]?.name ?? game
									}))}
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
