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
	if (!user || !user.preferences) return null;

	const { preferences } = user;
	const notificationKeys = keys(user.preferences.emailNotifications);

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				email: notificationKeys.filter((key) => preferences.emailNotifications[key]),
				mobile: keys(omit(preferences.emailNotifications, ["newsletter"])) // todo: fix this.
			}}
			onSubmit={async (values) => {
				if (!user.preferences) return;

				await api.user.preferences.updateNotifications(
					user.id,
					Object.fromEntries(
						keys(preferences.emailNotifications).map((key) => [key, values.email.includes(key)])
					)
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
									items={[
										{ key: "matches", label: "Match notifications" },
										{ key: "messages", label: "Message notifications" },
										{ key: "likes", label: "Weekly profile like reminders" },
										{ key: "newsletter", label: "Product updates", labelHint: "we won't spam you!" }
									]}
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
									items={[
										{ key: "matches", label: "Match notifications" },
										{ key: "messages", label: "Message notifications" },
										{ key: "likes", label: "Weekly profile like reminders" }
									]}
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
