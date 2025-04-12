"use client";

import {
	AppUpdate,
	AppUpdateAvailability,
	type AppUpdateInfo
} from "@capawesome/capacitor-app-update";
import ms from "ms";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useDevice } from "~/hooks/use-device";
import { useSWR } from "~/swr";

import { Button } from "./button";
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

const NativeStartup: React.FC = () => {
	const t = useTranslations();
	const { native } = useDevice();

	const { data: updateInformation = null } = useSWR<AppUpdateInfo | null>(
		native && "native-app-update",
		() => AppUpdate.getAppUpdateInfo(),
		{
			fallbackData: null,
			refreshInterval: ms("1m"),
			refreshWhenHidden: true
		}
	);

	useEffect(() => {
		if (
			!updateInformation
			|| updateInformation.updateAvailability
			!== AppUpdateAvailability.UPDATE_AVAILABLE
		)
			return;

		if (updateInformation.flexibleUpdateAllowed)
			void AppUpdate.startFlexibleUpdate();
	}, [updateInformation]);

	useEffect(() => {
		void import("@capacitor-community/safe-area")
			.then(({ SafeArea }) => SafeArea.enable({
				config: {
					customColorsForSystemBars: true,
					statusBarColor: "#00000000",
					navigationBarColor: "#00000000",
					offset: 10
				}
			}))
			.catch(() => {});
	}, []);

	if (
		!native
		|| !updateInformation
		|| updateInformation.updateAvailability
		!== AppUpdateAvailability.UPDATE_AVAILABLE
		|| updateInformation.flexibleUpdateAllowed
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
							{t("update")}
						</Button>
					</AlertDialogAction>
				</DialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default NativeStartup;
