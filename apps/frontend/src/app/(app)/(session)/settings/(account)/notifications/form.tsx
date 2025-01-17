"use client";

import { Mail, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { fromEntries, keys } from "remeda";

import { Preferences } from "~/api/user/preferences";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useTranslations } from "~/hooks/use-internationalization";
import { useCurrentUser } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const NotificationsForm: React.FC = () => {
	const user = useCurrentUser();
	const toasts = useToast();
	const router = useRouter();
	const t = useTranslations();

	if (!user || !user.preferences) return null;
	const { preferences } = user;

	return (
		<Form
			fields={{
				email: keys(preferences.emailNotifications).filter(
					(key) => preferences.emailNotifications[key]
				),
				push: keys(preferences.pushNotifications).filter(
					(key) => preferences.pushNotifications[key]
				)
			}}
			className="flex flex-col gap-8"
			onSubmit={async (values) => {
				await Preferences.updateNotifications(user.id, {
					email: fromEntries(
						keys(preferences.emailNotifications).map((key) => [
							key,
							values.email.includes(key)
						])
					),
					push: fromEntries(
						keys(preferences.pushNotifications).map((key) => [
							key,
							values.push.includes(key)
						])
					)
				});

				toasts.add(t("merry_smart_snake_boil"));
				router.refresh();
			}}
		>
			{({ FormField }) => (
				<>
					<div className="grid grid-cols-[1fr_auto_auto] gap-4">
						<div />
						<Tooltip>
							<TooltipTrigger asChild>
								<Mail width="32" />
							</TooltipTrigger>
							<TooltipContent>Emails</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Smartphone width="32" />
							</TooltipTrigger>
							<TooltipContent>Mobile notifications</TooltipContent>
						</Tooltip>

						<div className="flex flex-col gap-2">
							{[
								"Match notifications",
								"Message notifications",
								"Weekly likes summary",
								"Tips and reminders",
								"Product updates"
							].map((type) => (
								<div
									className="flex h-8 items-center text-lg leading-4"
									key={type}
								>
									{type}
								</div>
							))}
						</div>

						<FormField name="email">
							{(field) => (
								<InputCheckboxList
									{...field.props}
									items={[
										{ key: "matches", label: null },
										{ key: "messages", label: null },
										{ key: "likes", label: null },
										{ key: "reminders", label: null },
										{ key: "newsletter", label: null }
									]}
								/>
							)}
						</FormField>
						<FormField name="push">
							{(field) => (
								<InputCheckboxList
									{...field.props}
									items={[
										{ key: "matches", label: null },
										{ key: "messages", label: null },
										{ key: "likes", label: null },
										{ key: "reminders", label: null },
										{ key: "newsletter", label: null }
									]}
								/>
							)}
						</FormField>
					</div>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
