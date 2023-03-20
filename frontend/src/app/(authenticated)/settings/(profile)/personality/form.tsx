"use client";

import { api } from "~/api";
import { personalityQuestionLabels } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useSessionPersonality } from "~/hooks/use-session-personality";
import { entries } from "~/utilities";

export const PersonalityForm: React.FC = () => {
	const [session, mutateSession] = useSession();
	const personality = useSessionPersonality();

	if (!session || !personality) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			onSubmit={async (body) => {
				const newProfile = await api.user.profile.updatePersonality(session.user.id, { body });

				await mutateSession({
					...session,
					user: {
						...session.user,
						profile: newProfile
					}
				});
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
					<FormButton />
				</>
			)}
		</Form>
	);
};
