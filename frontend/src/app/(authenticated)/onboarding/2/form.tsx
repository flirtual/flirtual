"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputAutocomplete, InputDateSelect, InputLabel, InputSwitch } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { InputPrivacySelect } from "~/components/inputs/specialized/privacy-select";
import { urls } from "~/urls";
import { filterBy, fromEntries } from "~/utilities";
import { InputCountrySelect, InputLanguageAutocomplete } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { AttributeCollection } from "~/api/attributes";

const AttributeKeys = [...(["gender", "sexuality", "platform", "game", "interest"] as const)];

export interface Onboarding2Props {
	games: AttributeCollection<"game">;
	interests: AttributeCollection<"interest">;
	platforms: AttributeCollection<"platform">;
	sexualities: AttributeCollection<"sexuality">;
	genders: AttributeCollection<"gender">;
}

export const Onboarding2Form: FC<Onboarding2Props> = (props) => {
	const { games, genders, interests, platforms, sexualities } = props;

	const [session, mutateSession] = useSession();

	const router = useRouter();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				bornAt: user.bornAt ? new Date(user.bornAt) : new Date(),
				country: user.profile.country ?? null,
				new: profile.new ?? false,
				sexualityPrivacy: user.preferences?.privacy.sexuality ?? "everyone",
				countryPrivacy: user.preferences?.privacy.country ?? "everyone",
				languages: user.profile.languages ?? [],
				...(fromEntries(
					AttributeKeys.map((type) => {
						return [
							type,
							filterBy(profile.attributes, "type", type).map(({ id }) => id) ?? []
						] as const;
					})
				) as { [K in (typeof AttributeKeys)[number]]: Array<string> }),
				interest: [
					...filterBy(profile.attributes, "type", "interest").map(({ id }) => id),
					...profile.customInterests
				]
			}}
			onSubmit={async ({ bornAt, interest, ...values }) => {
				const customInterests = interest.filter(
					(id) => !interests.find((interest) => interest.id === id)
				);

				const [newUser, newProfile, privacyPreferences] = await Promise.all([
					api.user.update(user.id, {
						query: {
							required: ["bornAt"]
						},
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
								AttributeKeys.filter((key) => key !== "interest").map((type) => {
									// @ts-expect-error: don't want to deal with this.
									return [`${type}Id`, values[type]] as const;
								})
							) as { [K in (typeof AttributeKeys)[number] as `${K}Ids`]: Array<string> }),
							interestId: interest.filter((id) => !customInterests.includes(id))
						}
					}),
					api.user.preferences.updatePrivacy(user.id, {
						body: {
							sexuality: values.sexualityPrivacy,
							country: values.countryPrivacy
						}
					})
				]);

				await mutateSession({
					...session,
					user: {
						...newUser,
						preferences: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							...newUser.preferences!,
							privacy: privacyPreferences
						},
						profile: {
							...newProfile
						}
					}
				});

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
							const simpleGenders = genders.filter((gender) => gender.metadata?.simple);
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
											limit={4}
											placeholder="Select your genders... (optional)"
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
								<InputLabel hint="(optional)">Location</InputLabel>
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
								<InputLanguageAutocomplete limit={5} {...field.props} />
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
					<FormField name="interest">
						{(field) => (
							<>
								<InputLabel hint="(up to 7)">Personal interest tags</InputLabel>
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
					<FormButton>Next page</FormButton>
				</>
			)}
		</Form>
	);
};
