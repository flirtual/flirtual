"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Preferences } from "~/api/user/preferences";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputSwitch } from "~/components/inputs";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const PrivacyForm: React.FC = () => {
	const { user } = useSession();
	const toasts = useToast();
	const t = useTranslations();

	if (!user.preferences) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{ ...user.preferences.privacy }}
			onSubmit={async (body, { reset }) => {
				const privacy = await Preferences.updatePrivacy(user.id, body);
				reset(privacy);

				toasts.add(t("blue_lost_quail_support"));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="personality">
						{(field) => (
							<>
								<InputLabel inline hint={t("personality_privacy_hint")}>
									{t("personality_privacy")}
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel inline hint={t("sexuality_privacy_hint")}>
									{t("sexuality_privacy")}
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel inline hint={t("country_privacy_hint")}>
									{t("country_privacy")}
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					{user.preferences?.nsfw && (
						<FormField name="kinks">
							{(field) => (
								<>
									<InputLabel inline hint={t("nsfw_privacy_hint")}>
										{t("nsfw_privacy")}
									</InputLabel>
									<InputPrivacySelect {...field.props} />
								</>
							)}
						</FormField>
					)}
					<FormField name="analytics">
						{(field) => (
							<>
								<InputLabel
									inline
									hint={(
										<InputLabelHint>
											<InlineLink
												className="flex w-fit items-center gap-2"
												href={urls.resources.privacyPolicy}
											>
												<HelpCircle className="w-4 shrink-0" />
												<span>{t("learn_more")}</span>
											</InlineLink>
										</InputLabelHint>
									)}
								>
									{t("tangy_front_anaconda_dash")}
								</InputLabel>
								<InputSwitch {...field.props} value={!field.props.value} onChange={(value) => field.props.onChange(!value)} />
							</>
						)}
					</FormField>
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
