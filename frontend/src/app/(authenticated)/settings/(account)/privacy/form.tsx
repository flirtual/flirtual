"use client";

import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputSwitch } from "~/components/inputs";
import { InputPrivacySelect } from "~/components/inputs/specialized";
import { useSessionUser } from "~/hooks/use-session";
import { urls } from "~/urls";

export const PrivacyForm: React.FC = () => {
	const user = useSessionUser();
	if (!user || !user.preferences) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{ ...user.preferences.privacy }}
			onSubmit={async (body, { reset }) => {
				const privacy = await api.user.preferences.updatePrivacy(user.id, { body });
				reset(privacy);
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
					<FormField name="kinks">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your nsfw tags?">
									Kink privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="analytics">
						{(field) => (
							<>
								<InputLabel
									inline
									hint={
										<InputLabelHint>
											<InlineLink className="flex w-fit items-center gap-2" href={urls.resources.privacyPolicy}>
												<QuestionMarkCircleIcon className="w-4 shrink-0" />
												<span>Learn more</span>
											</InlineLink>
										</InputLabelHint>
									}
								>
									Opt-out of anonymous statistics?
								</InputLabel>
								<InputSwitch {...field.props} invert />
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
