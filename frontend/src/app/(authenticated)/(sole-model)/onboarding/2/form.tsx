"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputAutocomplete, InputDateSelect, InputLabel, InputSwitch } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useGenderList } from "~/hooks/use-gender-list";
import { InputPrivacySelect } from "~/components/inputs/specialized/privacy-select";
import { urls } from "~/urls";
import { pick } from "~/utilities";
import { InputCountrySelect, InputLanguageAutocomplete } from "~/components/inputs/specialized";

export const Onboarding2Form: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	const router = useRouter();

	const { data: games = [] } = useAttributeList("game");
	const { data: interests = [] } = useAttributeList("interest");
	const { data: platforms = [] } = useAttributeList("platform");
	const { data: sexualities = [] } = useAttributeList("sexuality");
	const genders = useGenderList();

	if (!user || !user.preferences) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				bornAt: user.bornAt ? new Date(user.bornAt) : new Date(),
				gender: user.profile.gender.map((gender) => gender.id) ?? [],
				sexuality: user.profile.sexuality?.map((sexuality) => sexuality.id) ?? [],
				sexualityPrivacy: user.preferences.privacy.sexuality ?? "everyone",
				country: user.profile.country ?? "",
				countryPrivacy: user.preferences.privacy.country ?? "everyone",
				languages: user.profile.languages ?? [],
				platforms: user.profile.platforms.map((platform) => platform.id) ?? [],
				new: false,
				games: user.profile.games.map((game) => game.id) ?? [],
				interests: user.profile.interests.map((interest) => interest.id) ?? []
			}}
			onSubmit={async (values) => {
				const [newUser, newProfile, newPrivacyPreferences] = await Promise.all([
					api.user.update(user.id, { bornAt: values.bornAt.toISOString() }),
					api.user.profile.update(user.id, {
						...pick(values, [
							"gender",
							"sexuality",
							"games",
							"languages",
							"platforms",
							"interests"
						]),
						country: values.country || undefined
					}),
					api.user.preferences.updatePrivacy(user.id, {
						sexuality: values.sexualityPrivacy,
						country: values.countryPrivacy
					})
				]);

				await mutateUser(
					{
						...newUser,
						profile: newProfile,
						preferences: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							...newUser.preferences!,
							privacy: newPrivacyPreferences
						}
					},
					{ revalidate: false }
				);

				router.push(urls.onboarding(3));
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
								<InputDateSelect {...field.props} max="now" />
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
										items={simpleGenders.map((gender) => ({
											key: gender.id,
											label: gender.name,
											conflicts:
												gender.metadata && Array.isArray(gender.metadata.conflicts)
													? gender.metadata.conflicts
													: []
										}))}
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
					<FormField name="sexualityPrivacy">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your sexuality?">
									Sexuality privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel>Country</InputLabel>
								<InputCountrySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="countryPrivacy">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your country?">
									Country privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
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
					<FormButton />
				</>
			)}
		</Form>
	);
};
