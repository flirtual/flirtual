"use client";

import { api } from "~/api";
import { personalityQuestionLabels } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useCurrentPersonality } from "~/hooks/use-current-personality";
import { useCurrentUser } from "~/hooks/use-current-user";
import { entries } from "~/utilities";

export const PersonalityForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();

	const personality = useCurrentPersonality();

	if (!user || !personality) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			onSubmit={async (personalityAnswers) => {
				await mutateUser(async (user) =>
					user
						? {
								...user,
								profile: await api.user.profile.updatePersonality(user.id, personalityAnswers)
						  }
						: null
				);
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
