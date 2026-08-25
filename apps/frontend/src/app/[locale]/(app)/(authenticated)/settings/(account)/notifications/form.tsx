import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { Mail, Smartphone } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { fromEntries, keys } from "remeda";

import { Preferences } from "~/api/user/preferences";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineButton } from "~/components/inline-button";
import { InputLabelHint } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useDevice } from "~/hooks/use-device";
import { requestNotificationPermission, useNotifications } from "~/hooks/use-notifications";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey } from "~/query";

function openNotificationSettings() {
	return NativeSettings.open({
		optionAndroid: AndroidSettings.AppNotification,
		optionIOS: IOSSettings.App
	});
}

export const NotificationsForm: React.FC = () => {
	const { user } = useSession();
	const toasts = useToast();
	const { native } = useDevice();
	const { status } = useNotifications();
	const { t } = useTranslation();

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
					email: fromEntries(keys(preferences.emailNotifications).map((key) => [key, values.email.includes(key)])),
					push: fromEntries(keys(preferences.pushNotifications).map((key) => [key, values.push.includes(key)]))
				});

				if (values.push.length > 0 && native)
					await requestNotificationPermission();

				await invalidate({ queryKey: sessionKey() });
				await toasts.add(t("merry_smart_snake_boil"));
			}}
		>
			{({ FormField, fields }) => (
				<>
					<div className="grid grid-cols-[1fr_auto_auto] gap-4">
						<div />
						<Tooltip>
							<TooltipTrigger asChild>
								<Mail width="32" />
							</TooltipTrigger>
							<TooltipContent>{t("emails")}</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Smartphone width="32" />
							</TooltipTrigger>
							<TooltipContent>{t("mobile_notifications")}</TooltipContent>
						</Tooltip>

						<div className="flex flex-col gap-2">
							{([
								"match_notifications",
								"message_notifications",
								"weekly_likes_summary",
								"tips_and_reminders",
								"product_updates"
							] as const).map((type) => (
								<span
									key={type}
									className="flex h-8 items-center text-lg leading-4"
								>
									{t(type)}
								</span>
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
					{native
						&& status === "denied"
						&& fields.push.props.value.length > 0 && (
						<InputLabelHint>
							<Trans
								components={{
									settings: (
										<InlineButton
											className="underline"
											highlight={false}
											onClick={openNotificationSettings}
										/>
									)
								}}
								i18nKey="push_notifications_blocked"
							/>
						</InputLabelHint>
					)}
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
