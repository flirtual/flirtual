"use client";

import { HelpCircle } from "lucide-react";

import { Preferences } from "~/api/user/preferences";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputSwitch } from "~/components/inputs";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useCurrentUser } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const PrivacyForm: React.FC = () => {
	const user = useCurrentUser();
	const toasts = useToast();

	if (!user || !user.preferences) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{ ...user.preferences.privacy }}
			onSubmit={async (body, { reset }) => {
				const privacy = await Preferences.updatePrivacy(user.id, body);
				reset(privacy);

				toasts.add("Saved privacy preferences");
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="personality">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your personality traits?">
									Personality privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your sexuality?">
									Sexuality privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your country?">
									Country privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					{user.preferences?.nsfw && (
						<FormField name="kinks">
							{(field) => (
								<>
									<InputLabel inline hint="Who can see your NSFW tags?">
										NSFW privacy
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
												<span>Learn more</span>
											</InlineLink>
										</InputLabelHint>
									)}
								>
									Opt-out of anonymous statistics?
								</InputLabel>
								<InputSwitch {...field.props} value={!field.props.value} onChange={(value) => field.props.onChange(!value)} />
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
