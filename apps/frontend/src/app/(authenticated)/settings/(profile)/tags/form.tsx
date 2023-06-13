"use client";

import { FC } from "react";

import { api } from "~/api";
import { AttributeCollection } from "~/api/attributes";
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
import { filterBy, fromEntries } from "~/utilities";

const AttributeKeys = [
	...(["gender", "sexuality", "platform", "game", "interest"] as const)
];

export interface TagsFormProps {
	games: AttributeCollection<"game">;
	interests: AttributeCollection<"interest">;
	platforms: AttributeCollection<"platform">;
	sexualities: AttributeCollection<"sexuality">;
	genders: AttributeCollection<"gender">;
}

export const TagsForm: FC<TagsFormProps> = (props) => {
	const { games, genders, interests, platforms, sexualities } = props;

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
				) as { [K in (typeof AttributeKeys)[number]]: Array<string> }),
				interest: [
					...filterBy(profile.attributes, "type", "interest").map(
						({ id }) => id
					),
					...profile.customInterests
				]
			}}
			onSubmit={async ({ bornAt, interest, gender, ...values }) => {
				const customInterests = interest.filter(
					(id) => !interests.some((interest) => interest.id === id)
				);

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
							customInterests,
							...(fromEntries(
								AttributeKeys.filter(
									(key) => key !== "interest" && key !== "gender"
								).map((type) => {
									// @ts-expect-error: don't want to deal with this.
									return [`${type}Id`, values[type]] as const;
								})
							) as {
									[K in (typeof AttributeKeys)[number]as `${K}Ids`]: Array<string>;
								}),
							genderId: gender.filter((id) => id !== "other"),
							interestId: interest.filter((id) => !customInterests.includes(id))
						}
					})
				]);

				toasts.add({
					type: "success",
					label: "Successfully updated profile tags!"
				});

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
									className="flex-col sm:flex-row"
									hint="(only your age will be visible)"
								>
									Date of birth
								</InputLabel>
								<InputDateSelect {...field.props} />
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
								<InputLabel hint="(optional)">Sexuality</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={3}
									placeholder="Select your sexualities..."
									options={sexualities.map((sexuality) => ({
										key: sexuality.id,
										label: sexuality.name
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel hint="(optional)">Location</InputLabel>
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
								<InputLabel hint="(up to 5)">Fav social VR games</InputLabel>
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
					<FormField name="interest">
						{(field) => (
							<>
								<InputLabel hint="(up to 7)">Personal interest tags</InputLabel>
								<InputLabelHint className="-mt-2">
									You can add custom interests too!
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									supportArbitrary
									limit={7}
									placeholder="Select your personal interests..."
									options={interests
										.map((interest) => ({
											key: interest.id,
											label: interest.name
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
								/>
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
