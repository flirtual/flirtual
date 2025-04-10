"use client";

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
import {
	type AttributeTranslation,
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useTranslations } from "next-intl";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const NsfwForm: React.FC = () => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	const t = useTranslations();
	const tAttribute = useAttributeTranslation();
	const kinks = useAttributes("kink");

	if (!session) return null;
	const { user } = session;

	return (
		<Form
			fields={{
				nsfw: user.preferences?.nsfw ?? false,
				domsub: user.profile.domsub,
				kinks: user.profile.attributes.kink ?? [],
				kinksPrivacy: user.preferences?.privacy.kinks ?? "everyone"
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ domsub, kinks, kinksPrivacy, nsfw }) => {
				const [newProfile, newPreferences] = await Promise.all([
					Profile.update(user.id, {
						domsub: domsub ?? "none",
						kinkId: kinks
					}),
					Preferences.update(user.id, { nsfw }),
					Preferences.updatePrivacy(user.id, {
						kinks: kinksPrivacy
					})
				]);

				toasts.add(t("born_sweet_nils_thrive"));

				await mutateSession({
					...session,
					user: {
						...session.user,
						profile: newProfile,
						preferences: newPreferences
					}
				});
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
											options={kinks.map(({ id, definitionLink }) => {
												const { name, definition } = (tAttribute[
													id
												] as AttributeTranslation<"kink">) ?? {
													name: id
												};

												return {
													key: id,
													label: name,
													definition,
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
