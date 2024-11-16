"use client";

import shuffle from "fast-shuffle";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { entries } from "remeda";

import { Profile } from "~/api/user/profile";
import {
	personalityQuestionLabels,
	type ProfilePersonality
} from "~/api/user/profile/personality";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const Finish4Form: React.FC<{ personality: ProfilePersonality }> = ({
	personality
}) => {
	const router = useRouter();

	const [session] = useSession();

	if (!session || !personality) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			requireChange={false}
			onSubmit={async (body) => {
				await Promise.all([Profile.Personality.update(user.id, body)]);

				router.push(urls.finish(5));
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
					<div className="flex justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.finish(3)}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5" />
							<span>Back</span>
						</ButtonLink>
						<FormButton className="w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};
