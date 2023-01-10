"use client";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useCurrentUser } from "~/hooks/use-current-user";
import { keys, omit } from "~/utilities";

export const NotificationsForm: React.FC = () => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				email: keys(user.preferences.emailNotifications),
				mobile: keys(omit(user.preferences.emailNotifications, ["newsletter"]))
			}}
			onSubmit={async (values) => {
				await api.user.preferences.updateNotifications(
					user.id,
					Object.fromEntries(values.email.map((key) => [key, true]))
				);
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="email">
						{(field) => (
							<>
								<InputLabel className="text-2xl font-semibold">Email notifications</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={{
										matches: {
											label: "Match notifications"
										},
										messages: {
											label: "Message notifications"
										},
										likes: {
											label: "Weekly profile like reminders"
										},
										newsletter: {
											label: "Product updates",
											labelHint: "we won't spam you!"
										}
									}}
								/>
							</>
						)}
					</FormField>
					<FormField name="mobile">
						{(field) => (
							<>
								<InputLabel className="text-2xl font-semibold">Mobile notifications</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={{
										matches: {
											label: "Match notifications"
										},
										messages: {
											label: "Message notifications"
										},
										likes: {
											label: "Weekly profile like reminders"
										}
									}}
								/>
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
