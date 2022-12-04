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
	const { data: user } = useCurrentUser();
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
				await Promise.all([
					api.user.preferences.updatePrivacy(user.id, { personality: personalityPrivacy }),
					api.user.profile.updatePersonality(user.id, personalityAnswers)
				]);

				router.push(user.emailConfirmedAt ? urls.user(user.username) : urls.confirmEmail());
			}}
		>
			{({ submitting, FormField }) => (
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
					<button
						className="relative rounded-xl bg-brand-gradient p-4 text-white-10 shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-coral focus:ring-offset-2"
						type="submit"
					>
						<span className="font-montserrat text-xl font-semibold">Continue</span>
						{submitting && (
							<div className="absolute right-0 top-0 flex h-full items-center px-4">
								<svg
									className="w-10"
									fill="#fff"
									viewBox="0 0 140 64"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M30.262 57.02L7.195 40.723c-5.84-3.976-7.56-12.06-3.842-18.063 3.715-6 11.467-7.65 17.306-3.68l4.52 3.76 2.6-5.274c3.717-6.002 11.47-7.65 17.305-3.68 5.84 3.97 7.56 12.054 3.842 18.062L34.49 56.118c-.897 1.512-2.793 1.915-4.228.9z"
										fillOpacity=".5"
									>
										<animate
											attributeName="fill-opacity"
											begin="0s"
											calcMode="linear"
											dur="1.4s"
											repeatCount="indefinite"
											values="0.5;1;0.5"
										/>
									</path>
									<path
										d="M105.512 56.12l-14.44-24.272c-3.716-6.008-1.996-14.093 3.843-18.062 5.835-3.97 13.588-2.322 17.306 3.68l2.6 5.274 4.52-3.76c5.84-3.97 13.592-2.32 17.307 3.68 3.718 6.003 1.998 14.088-3.842 18.064L109.74 57.02c-1.434 1.014-3.33.61-4.228-.9z"
										fillOpacity=".5"
									>
										<animate
											attributeName="fill-opacity"
											begin="0.7s"
											calcMode="linear"
											dur="1.4s"
											repeatCount="indefinite"
											values="0.5;1;0.5"
										/>
									</path>
									<path d="M67.408 57.834l-23.01-24.98c-5.864-6.15-5.864-16.108 0-22.248 5.86-6.14 15.37-6.14 21.234 0L70 16.168l4.368-5.562c5.863-6.14 15.375-6.14 21.235 0 5.863 6.14 5.863 16.098 0 22.247l-23.007 24.98c-1.43 1.556-3.757 1.556-5.188 0z" />
								</svg>
							</div>
						)}
					</button>
				</>
			)}
		</Form>
	);
};
