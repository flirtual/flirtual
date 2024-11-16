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
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const NsfwForm: React.FC = () => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	const kinks = useAttributes("kink");
	const tAttribute = useAttributeTranslation();

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

				toasts.add("Saved NSFW preferences");

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
									hint="Choose whether to display NSFW tags on other people's profiles."
								>
									Show NSFW tags on profiles?
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
										<InputLabel {...field.labelProps}>I am...</InputLabel>
										<InputRadioList
											{...field.props}
											items={ProfileDomsubList.map((value) => ({
												key: value,
												label: {
													dominant: "Dominant",
													submissive: "Submissive",
													switch: "Switch"
												}[value]
											}))}
										/>
									</>
								)}
							</FormField>
							<FormField name="kinks">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>Kinks</InputLabel>
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
										<InputLabel inline hint="Who can see your NSFW tags?">
											NSFW privacy
										</InputLabel>
										<InputPrivacySelect {...field.props} />
									</>
								)}
							</FormField>
						</>
					)}
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
