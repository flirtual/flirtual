"use client";

import shuffle from "fast-shuffle";
import type { FC } from "react";
import { entries } from "remeda";

import {
	Personality,
	type ProfilePersonality
} from "~/api/user/profile/personality";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useTranslations } from "~/hooks/use-internationalization";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const PersonalityForm: FC<{ personality: ProfilePersonality }> = ({
	personality
}) => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();
	const t = useTranslations();

	if (!session || !personality) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			onSubmit={async (body) => {
				const newProfile = await Personality.update(user.id, body);

				toasts.add(t("wide_stock_skate_radiate"));

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
						{t("quiet_gross_skate_honor")}
					</InputLabel>
					{shuffle(
						Number.parseInt(user.talkjsId.slice(0, 8), 16),
						entries(personality)
					).map(([name]) => (
						<FormField key={name} name={name}>
							{(field) => (
								<div className="flex items-center justify-between gap-4">
									<InputLabel {...field.labelProps} inline>
										{t(`personality_questions.${Number.parseInt(name.slice(-1))}` as any)}
									</InputLabel>
									<InputSwitch {...field.props} />
								</div>
							)}
						</FormField>
					))}
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
