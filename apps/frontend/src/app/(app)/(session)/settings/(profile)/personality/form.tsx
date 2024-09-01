"use client";

import shuffle from "fast-shuffle";

import { api } from "~/api";
import {
	type ProfilePersonality,
	personalityQuestionLabels
} from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { entries } from "~/utilities";

import type { FC } from "react";

export const PersonalityForm: FC<{ personality: ProfilePersonality }> = ({
	personality
}) => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	if (!session || !personality) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			onSubmit={async (body) => {
				const newProfile = await api.user.profile.updatePersonality(
					session.user.id,
					{ body }
				);

				toasts.add("Saved personality settings");

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
					<InputLabel>
						This helps us match you with people you&apos;ll vibe with, based on
						the Big 5 Personality Test.
					</InputLabel>
					{shuffle(
						Number.parseInt(user.talkjsId.slice(0, 8), 16),
						entries(personality)
					).map(([name]) => (
						<FormField key={name} name={name}>
							{(field) => (
								<div className="flex items-center justify-between gap-4">
									<InputLabel {...field.labelProps} inline>
										{personalityQuestionLabels[Number.parseInt(name.slice(-1))]}
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
