"use client";

import shuffle from "fast-shuffle";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { entries } from "remeda";

import {
	Personality,
} from "~/api/user/profile/personality";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import {
	invalidate,
	personalityFetcher,
	personalityKey,
	useQuery,
} from "~/query";

// eslint-disable-next-line react-refresh/only-export-components
export function usePersonality() {
	const session = useSession();

	return useQuery({
		queryKey: personalityKey(session.user.id),
		queryFn: personalityFetcher
	});
}

export const PersonalityForm: FC = () => {
	const session = useSession();
	const { user } = session;

	const personality = usePersonality();

	const toasts = useToast();
	const t = useTranslations();

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			onSubmit={async (body) => {
				await Personality.update(user.id, body);
				await invalidate({ queryKey: personalityKey(user.id) });
				toasts.add(t("wide_stock_skate_radiate"));
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
