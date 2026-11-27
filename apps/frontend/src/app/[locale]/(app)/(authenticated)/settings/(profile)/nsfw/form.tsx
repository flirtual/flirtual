import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { Session } from "~/api/auth";
import { kinksOptions } from "~/api/data";
import { Preferences } from "~/api/user/preferences";
import { Profile, ProfileDomsubList } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputRadioList,
	InputSwitch
} from "~/components/inputs";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useLocale } from "~/i18n";
import { invalidate, mutate, sessionKey } from "~/query";

export const NsfwForm: React.FC = () => {
	const session = useSession();
	const toasts = useToast();

	const { t } = useTranslation();
	const [locale] = useLocale();
	const { data: kinks } = useSuspenseQuery(kinksOptions({ locale }));

	if (!session) return null;
	const { user } = session;

	return (
		<Form
			fields={{
				nsfw: user.preferences?.nsfw ?? false,
				domsub: user.profile.domsub,
				kinks: user.profile.kinks ?? [],
				kinksPrivacy: user.preferences?.privacy.kinks ?? "everyone"
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ domsub, kinks, kinksPrivacy, nsfw }) => {
				const [newProfile, newPreferences, newPrivacy] = await Promise.all([
					Profile.update(user.id, {
						domsub: domsub ?? null,
						kinkId: kinks
					}),
					Preferences.update(user.id, { nsfw }),
					Preferences.updatePrivacy(user.id, {
						kinks: kinksPrivacy
					})
				]);

				toasts.add(t("saved_nsfw"));

				await Promise.all([
					mutate<Session>(sessionKey(), (session) => ({
						...session,
						user: {
							...session.user,
							profile: newProfile,
							preferences: {
								...newPreferences,
								privacy: newPrivacy
							}
						}
					})),
					invalidate({ queryKey: ["user"], exact: false })
				]);
			}}
		>
			{({ FormField, fields }) => (
				<>
					<FormField name="nsfw">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									inline
									hint={t("show_nsfw_hint")}
								>
									{t("show_nsfw")}
								</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					{fields.nsfw.props.value && (
						<>
							<FormField name="domsub">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>{t("i_am")}</InputLabel>
										<InputRadioList
											{...field.props}
											items={ProfileDomsubList.map((value) => ({
												key: value,
												label: t(value)
											}))}
										/>
									</>
								)}
							</FormField>
							<FormField name="kinks">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>{t("kinks")}</InputLabel>
										<InputAutocomplete
											{...field.props}
											options={kinks.map(({ id, name, definitionLink }) => {
												return {
													key: id,
													label: name,
													definitionLink
												};
											})}
											limit={8}
										/>
									</>
								)}
							</FormField>
							<FormField name="kinksPrivacy">
								{(field) => (
									<>
										<InputLabel inline hint={t("nsfw_privacy_hint")}>
											{t("nsfw_privacy")}
										</InputLabel>
										<InputPrivacySelect {...field.props} />
									</>
								)}
							</FormField>
						</>
					)}
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
