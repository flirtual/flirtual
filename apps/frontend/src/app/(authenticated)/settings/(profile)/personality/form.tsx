"use client";

import { FC } from "react";

import { api } from "~/api";
import {
	ProfilePersonality,
	personalityQuestionLabels
} from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { entries } from "~/utilities";

export const PersonalityForm: FC<{ personality: ProfilePersonality }> = ({
	personality
}) => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	if (!session || !personality) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			onSubmit={async (body) => {
				const newProfile = await api.user.profile.updatePersonality(
					session.user.id,
					{ body }
				);

				toasts.add({
					type: "success",
					label: "Successfully updated personality settings!"
				});

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
						This helps us match you with compatible people, based on the Big 5
						Personality Test.
					</InputLabel>
					{entries(personality).map(([name], questionIndex) => (
						<FormField key={questionIndex} name={name}>
							{(field) => (
								<div className="flex justify-between gap-4">
									<InputLabel {...field.labelProps} inline>
										{personalityQuestionLabels[questionIndex]}
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
