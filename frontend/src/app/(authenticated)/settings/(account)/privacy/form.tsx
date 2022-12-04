"use client";

import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

import { api } from "~/api";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { FormPrivacySelect } from "~/components/forms/form-privacy-select";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputLabelHint, InputSwitch } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";

export const PrivacyForm: React.FC = () => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				...user.preferences.privacy
			}}
			onSubmit={async (values, { reset }) => {
				const privacy = await api.user.preferences.updatePrivacy(user.id, values);
				reset(privacy);
			}}
		>
			{({ FormField, buttonProps }) => (
				<>
					<FormField name="personality">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your personality traits?">
									Personality privacy
								</InputLabel>
								<FormPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your sexuality?">
									Sexuality privacy
								</InputLabel>
								<FormPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your country?">
									Country privacy
								</InputLabel>
								<FormPrivacySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="kinks">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your nsfw tags?">
									Kink privacy
								</InputLabel>
								<FormPrivacySelect {...field.props} />
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
											<InlineLink className="flex w-fit items-center gap-2" href="/privacy-policy">
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
					<Button {...buttonProps}>Update</Button>
				</>
			)}
		</Form>
	);
};
