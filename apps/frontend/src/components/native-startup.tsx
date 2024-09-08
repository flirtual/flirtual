"use client";

import {
	AppUpdate,
	AppUpdateAvailability,
	type AppUpdateInfo
} from "@capawesome/capacitor-app-update";
import { StatusBar } from "@capacitor/status-bar";
import { useEffect } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import ms from "ms";

import { useDevice } from "~/hooks/use-device";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle
} from "./dialog/alert";
import { DialogFooter } from "./dialog/dialog";
import { Button } from "./button";

const NativeStartup: React.FC = () => {
	const t = useTranslations();
	const { native } = useDevice();

	const { data: updateInformation = null } = useSWR<AppUpdateInfo | null>(
		native && "native-app-update",
		() => AppUpdate.getAppUpdateInfo(),
		{
			fallbackData: null,
			refreshInterval: ms("1m"),
			refreshWhenHidden: false
		}
	);

	useEffect(() => {
		if (
			!updateInformation ||
			updateInformation.updateAvailability !==
				AppUpdateAvailability.UPDATE_AVAILABLE
		)
			return;

		if (updateInformation.flexibleUpdateAllowed)
			void AppUpdate.startFlexibleUpdate();
	}, [updateInformation]);

	useEffect(() => {
		void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
		void import("@aashu-dubey/capacitor-statusbar-safe-area")
			.then(({ SafeAreaController }) => SafeAreaController.injectCSSVariables())
			.catch(() => {});
	}, []);

	if (
		!native ||
		!updateInformation ||
		updateInformation.updateAvailability !==
			AppUpdateAvailability.UPDATE_AVAILABLE ||
		updateInformation.flexibleUpdateAllowed
	)
		return null;

	return (
		<AlertDialog defaultOpen>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("early_north_alpaca_sail")}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>
					{t("icy_sound_emu_kiss")}
				</AlertDialogDescription>
				<DialogFooter>
					<AlertDialogCancel asChild>
						<Button kind="tertiary" size="sm">
							{t("aware_such_leopard_fond")}
						</Button>
					</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button size="sm" onClick={() => AppUpdate.openAppStore()}>
							{t("patient_gross_herring_grow")}
						</Button>
					</AlertDialogAction>
				</DialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default NativeStartup;
