"use client";

import { api } from "~/api";
import { ProfileDomsubList } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputAutocomplete, InputLabel, InputRadioList, InputSwitch } from "~/components/inputs";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useKinkList } from "~/hooks/use-kink-list";

export const NsfwForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	const kinks = useKinkList();

	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				nsfw: user.preferences?.nsfw ?? false,
				domsub: user.profile.domsub,
				kinks: user.profile.kinks?.map((attribute) => attribute.id) ?? [],
				kinksPrivacy: user.preferences?.privacy.kinks ?? "everyone"
			}}
			onSubmit={async ({ domsub, kinks, kinksPrivacy, nsfw }) => {
				const [newProfile, , newPreferences] = await Promise.all([
					api.user.profile.update(user.id, { domsub, kinks }),
					api.user.preferences.updatePrivacy(user.id, { kinks: kinksPrivacy }),
					api.user.preferences.update(user.id, { nsfw })
				]);

				await mutateUser((user) =>
					user
						? {
								...user,
								profile: newProfile,
								preferences: newPreferences
						  }
						: null
				);
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
										<InputLabel {...field.labelProps}>What is your preference?</InputLabel>
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
										<InputLabel inline hint="Who can see your nsfw tags?">
											Kink privacy
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
