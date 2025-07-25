import { PushNotifications } from "@capacitor/push-notifications";
import { IOSSettings, NativeSettings } from "capacitor-native-settings";
import { Mail, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { fromEntries, keys } from "remeda";

import { Preferences } from "~/api/user/preferences";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const NotificationsForm: React.FC = () => {
	const { user } = useSession();
	const toasts = useToast();
	const navigate = useNavigate();
	const { native, platform } = useDevice();
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

				if (values.push.length > 0 && native) {
					const { receive } = await PushNotifications.requestPermissions();

					if (receive === "granted") {
						await PushNotifications.register();
					}
					else if (platform === "apple") {
						toasts.add(t("main_fit_lark_imagine"));
						await new Promise((resolve) => {
							setTimeout(resolve, 2000);
						});
						NativeSettings.openIOS({ option: IOSSettings.App });
					}
				}

				toasts.add(t("merry_smart_snake_boil"));

				// router.refresh();
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
							<TooltipContent>{t("emails")}</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Smartphone width="32" />
							</TooltipTrigger>
							<TooltipContent>{t("mobile_notifications")}</TooltipContent>
						</Tooltip>

						<div className="flex flex-col gap-2">
							{[
								"match_notifications",
								"message_notifications",
								"weekly_likes_summary",
								"tips_and_reminders",
								"product_updates"
							].map((type) => (
								<div
									key={type}
									className="flex h-8 items-center text-lg leading-4"
								>
									{t(type as any)}
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
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
