"use client";

import { api } from "~/api";
import { AttributeCollection } from "~/api/attributes";
import { ProfileDomsubList } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputAutocomplete, InputLabel, InputRadioList, InputSwitch } from "~/components/inputs";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { filterBy } from "~/utilities";

export const NsfwForm: React.FC<{ kinks: AttributeCollection<"kink"> }> = ({ kinks }) => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	if (!session) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				nsfw: user.preferences?.nsfw ?? false,
				domsub: user.profile.domsub,
				kinks: filterBy(user.profile.attributes, "type", "kink").map(({ id }) => id) ?? [],
				kinksPrivacy: user.preferences?.privacy.kinks ?? "everyone"
			}}
			onSubmit={async ({ domsub, kinks, kinksPrivacy, nsfw }) => {
				const [newProfile, , newPreferences] = await Promise.all([
					api.user.profile.update(user.id, {
						body: {
							domsub: domsub ?? "none",
							kinkId: kinks
						}
					}),
					api.user.preferences.updatePrivacy(user.id, { body: { kinks: kinksPrivacy } }),
					api.user.preferences.update(user.id, { body: { nsfw } })
				]);

				toasts.add({ type: "success", label: "Successfully updated NSFW settings!" });

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
									hint="Choose whether to display NSFW tags on other users' profiles."
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
											limit={8}
											options={kinks.map((attribute) => ({
												key: attribute.id,
												label: attribute.name
											}))}
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
