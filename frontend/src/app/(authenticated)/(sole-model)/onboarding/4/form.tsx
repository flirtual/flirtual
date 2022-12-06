"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";

import { InputLabel, InputSelect, InputSwitch } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { Form } from "~/components/forms";
import { PrivacyPreferenceOptions } from "~/api/user/preferences";
import { privacyOptionLabel } from "~/const";
import { api } from "~/api";
import { entries } from "~/utilities";
import { urls } from "~/pageUrls";
import { FormButton } from "~/components/forms/button";

const questions = [
	"I plan my life out",
	"Rules are important to follow",
	"I daydream a lot",
	"The truth is more important than people's feelings",
	"I often do spontaneous things",
	"Deep down most people are good people",
	"I love helping people",
	"I dislike it when things change",
	"I find many things beautiful"
];

export const Onboarding4Form: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	const router = useRouter();

	const { data: personality } = useSWR("personality", () => {
		if (!user) return null;
		return api.user.profile.getPersonality(user.id);
	});

	if (!user || !personality) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				...personality,
				personalityPrivacy: user.preferences.privacy.personality ?? "everyone"
			}}
			onSubmit={async ({ personalityPrivacy, ...personalityAnswers }) => {
				const [newPrivacyPreferences, newProfile] = await Promise.all([
					api.user.preferences.updatePrivacy(user.id, { personality: personalityPrivacy }),
					api.user.profile.updatePersonality(user.id, personalityAnswers)
				]);

				await mutateUser((user) =>
					user
						? {
								...user,
								preferences: {
									...user.preferences,
									privacy: newPrivacyPreferences
								},
								profile: newProfile
						  }
						: null
				);

				router.push(user.emailConfirmedAt ? urls.user(user.username) : urls.confirmEmail());
			}}
		>
			{({ FormField }) => (
				<>
					<InputLabel
						inline
						hint="Your answers are hidden from other users, and you can skip this and come back later."
					>
						This helps us match you with compatible people, based on the Big 5 Personality Test.
					</InputLabel>
					{entries(personality).map(([name], questionIdx) => (
						<FormField key={questionIdx} name={name}>
							{(field) => (
								<div className="flex justify-between gap-4">
									<InputLabel {...field.labelProps} inline>
										{questions[questionIdx]}
									</InputLabel>
									<InputSwitch {...field.props} />
								</div>
							)}
						</FormField>
					))}
					<FormField name="personalityPrivacy">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your personality traits?">
									Personality privacy
								</InputLabel>
								<InputSelect
									{...field.props}
									options={PrivacyPreferenceOptions.map((option) => ({
										key: option,
										label: privacyOptionLabel[option]
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
