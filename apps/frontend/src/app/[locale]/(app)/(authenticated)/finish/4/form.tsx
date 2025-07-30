import shuffle from "fast-shuffle";
import { MoveLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { entries } from "remeda";

import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { useOptionalSession } from "~/hooks/use-session";
import { useNavigate } from "~/i18n";
import { urls } from "~/urls";

import { usePersonality } from "../../settings/(profile)/personality/form";

export const Finish4Form: React.FC = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const session = useOptionalSession();
	const personality = usePersonality();

	if (!session || !personality) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={personality}
			requireChange={false}
			onSubmit={async (body) => {
				await Profile.Personality.update(user.id, body);

				navigate(urls.finish(5));
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
					<div className="flex justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.finish(3)}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5" />
							<span>{t("back")}</span>
						</ButtonLink>
						<FormButton className="min-w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};
