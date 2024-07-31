"use client";

import { api } from "~/api";
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
import InputDateSelectNative from "~/components/inputs/date-select-native";
import {
	InputCountrySelect,
	InputLanguageAutocomplete
} from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { filterBy, fromEntries } from "~/utilities";

import type { AttributeCollection } from "~/api/attributes";
import type { FC } from "react";

const AttributeKeys = [
	...(["gender", "sexuality", "platform", "game"] as const)
];

export interface InfoFormProps {
	games: AttributeCollection<"game">;
	platforms: AttributeCollection<"platform">;
	sexualities: AttributeCollection<"sexuality">;
	genders: AttributeCollection<"gender">;
}

export const InfoForm: FC<InfoFormProps> = (props) => {
	const { games, genders, platforms, sexualities } = props;

	const [session, mutateSession] = useSession();
	const toasts = useToast();

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
				...(fromEntries(
					AttributeKeys.map((type) => {
						return [
							type,
							filterBy(profile.attributes, "type", type).map(({ id }) => id) ??
								[]
						] as const;
					})
				) as { [K in (typeof AttributeKeys)[number]]: Array<string> })
			}}
			onSubmit={async ({ bornAt, gender, ...values }) => {
				const [newUser, newProfile] = await Promise.all([
					api.user.update(user.id, {
						body: {
							bornAt: bornAt.toISOString()
						}
					}),
					api.user.profile.update(user.id, {
						query: {
							required: ["languages", "new"]
						},
						body: {
							country: values.country ?? "none",
							languages: values.languages,
							new: values.new,
							// @ts-expect-error: don't want to deal with this.
							...(fromEntries(
								AttributeKeys.filter((key) => key !== "gender").map((type) => {
									return [`${type}Id`, values[type]] as const;
								})
							) as {
								[K in (typeof AttributeKeys)[number] as `${K}Ids`]: Array<string>;
							}),
							genderId: gender.filter((id) => id !== "other")
						}
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
							const simpleGenders = genders.filter(
								(gender) => gender.metadata?.simple
							);
							const simpleGenderIds = new Set(
								simpleGenders.map((gender) => gender.id)
							);
							const checkboxValue = field.props.value.some(
								(id) => !simpleGenderIds.has(id) && id !== "other"
							)
								? [...field.props.value, "other"]
								: field.props.value;

							return (
								<>
									<InputLabel {...field.labelProps}>Gender</InputLabel>
									<InputCheckboxList
										{...field.props}
										value={checkboxValue}
										items={[
											...simpleGenders.map((gender) => ({
												key: gender.id,
												label: gender.name,
												conflicts:
													gender.metadata &&
													Array.isArray(gender.metadata.conflicts)
														? gender.metadata.conflicts
														: []
											})),
											{
												key: "other",
												label: "Other"
											}
										]}
									/>
									{checkboxValue.includes("other") && (
										<InputAutocomplete
											{...field.props}
											limit={4}
											placeholder="Select your genders..."
											options={genders.map((gender) => ({
												key: gender.id,
												label: gender.name,
												definition: gender.metadata.definition,
												definitionLink: gender.metadata.definitionLink,
												hidden: simpleGenderIds.has(gender.id)
											}))}
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
									options={sexualities.map((sexuality) => ({
										key: sexuality.id,
										label: sexuality.name,
										definition: sexuality.metadata.definition,
										definitionLink: sexuality.metadata.definitionLink
									}))}
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
									limit={8}
									placeholder="Select the platforms you use..."
									options={platforms.map((platform) => ({
										key: platform.id,
										label: platform.name
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
									options={games.map((game) => ({
										key: game.id,
										label: game.name
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
