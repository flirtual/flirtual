"use client";

import { api } from "~/api";
import { GenderAttributeMetadata } from "~/api/attributes";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputDateSelect,
	InputLabel,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { CountryCode, getCountries, getLanguages, LanguageCode } from "~/countries";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useCurrentUser } from "~/hooks/use-current-user";

export const TagsForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	const { data: games = [] } = useAttributeList("game");
	const { data: genders = [] } = useAttributeList<GenderAttributeMetadata>("gender");
	const { data: interests = [] } = useAttributeList("interest");
	const { data: platforms = [] } = useAttributeList("platform");
	const { data: sexualities = [] } = useAttributeList("sexuality");

	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				bornAt: user.bornAt ? new Date(user.bornAt) : new Date(),
				gender: user.profile.gender.map((gender) => gender.id) ?? [],
				sexuality: user.profile.sexuality.map((sexuality) => sexuality.id) ?? [],
				country: (user.profile.country ?? "") as CountryCode | "",
				languages: user.profile.languages ?? [],
				platforms: user.profile.platforms.map((platform) => platform.id) ?? [],
				new: user.profile.new ?? false,
				games: user.profile.games.map((game) => game.id) ?? [],
				interests: user.profile.interests.map((interest) => interest.id) ?? []
			}}
			onSubmit={async (values) => {
				const { bornAt, country, ...profileValues } = values;

				const [newUser, newProfile] = await Promise.all([
					api.user.update(user.id, { bornAt: bornAt.toISOString() }),
					api.user.profile.update(user.id, {
						...profileValues,
						country: country || undefined
					})
				]);

				await mutateUser(
					{
						...newUser,
						profile: newProfile
					},
					{ revalidate: false }
				);
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
							const simpleGenders = genders
								.filter((gender) => gender.metadata?.simple)
								.sort((a, b) => ((a.metadata?.order ?? 0) > (b.metadata?.order ?? 0) ? 1 : -1));
							const simpleGenderIds = simpleGenders.map((gender) => gender.id);

							const fallbackGender = genders.find((gender) => gender.metadata?.fallback);

							return (
								<>
									<InputLabel {...field.labelProps}>Gender</InputLabel>
									<InputCheckboxList
										{...field.props}
										items={Object.fromEntries(
											simpleGenders.map((gender) => [
												gender.id,
												{
													label: gender.name,
													conflicts:
														gender.metadata && Array.isArray(gender.metadata.conflicts)
															? gender.metadata.conflicts
															: []
												}
											])
										)}
									/>
									{field.props.value.includes(fallbackGender?.id ?? "") && (
										<InputAutocomplete
											{...field.props}
											limit={6}
											placeholder="Select your genders..."
											options={genders.map((gender) => ({
												key: gender.id,
												label: gender.name,
												hidden: simpleGenderIds.includes(gender.id)
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
										label: sexuality.name
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel>Country</InputLabel>
								<InputSelect
									{...field.props}
									options={getCountries()
										.map(({ code, name }) => ({
											key: code as CountryCode,
											label: name
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
								/>
							</>
						)}
					</FormField>
					<FormField name="languages">
						{(field) => (
							<>
								<InputLabel>Language</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={3}
									options={getLanguages()
										.map(({ code, name }) => ({
											key: code as LanguageCode,
											label: name
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
								/>
							</>
						)}
					</FormField>
					<FormField name="platforms">
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
					<FormField name="games">
						{(field) => (
							<>
								<InputLabel>Favorite social VR games</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={5}
									options={games.map((game) => ({ key: game.id, label: game.name }))}
									placeholder="Select your favorite games..."
								/>
							</>
						)}
					</FormField>
					<FormField name="new">
						{(field) => (
							<>
								<InputLabel>New to Virtual Reality</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="interests">
						{(field) => (
							<>
								<InputLabel>Personal interests</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={7}
									placeholder="Select your personal interests..."
									options={interests.map((interest) => ({
										key: interest.id,
										label: interest.name
									}))}
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
