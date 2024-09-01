"use client";

import { Mail, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useSessionUser } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { fromEntries, keys } from "~/utilities";

export const NotificationsForm: React.FC = () => {
	const user = useSessionUser();
	const toasts = useToast();
	const router = useRouter();

	if (!user || !user.preferences) return null;
	const { preferences } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				email: keys(preferences.emailNotifications).filter(
					(key) => preferences.emailNotifications[key]
				),
				push: keys(preferences.pushNotifications).filter(
					(key) => preferences.pushNotifications[key]
				)
			}}
			onSubmit={async (values) => {
				await api.user.preferences.updateNotifications(user.id, {
					body: {
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
					}
				});

				toasts.add("Saved notification preferences");
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
