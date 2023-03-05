"use client";

import { useRouter } from "next/navigation";

import { InputLabel, InputSwitch } from "~/components/inputs";
import { Form } from "~/components/forms";
import { api } from "~/api";
import { entries } from "~/utilities";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { personalityQuestionLabels } from "~/api/user/profile";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useSessionPersonality } from "~/hooks/use-session-personality";
import { useSession } from "~/hooks/use-session";

export const Onboarding4Form: React.FC = () => {
	const router = useRouter();

	const [session] = useSession();
	const personality = useSessionPersonality();

	if (!session || !personality) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				...personality,
				personalityPrivacy: user.preferences?.privacy.personality ?? "everyone"
			}}
			onSubmit={async ({ personalityPrivacy, ...personalityAnswers }) => {
				await Promise.all([
					api.user.preferences.updatePrivacy(user.id, {
						body: { personality: personalityPrivacy }
					}),
					api.user.profile.updatePersonality(user.id, {
						body: personalityAnswers
					})
				]);

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
										{personalityQuestionLabels[questionIdx]}
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
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormButton />
				</>
			)}
		</Form>
	);
};
