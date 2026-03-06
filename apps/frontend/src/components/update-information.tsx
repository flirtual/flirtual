import {
	AppUpdate,
	AppUpdateAvailability,
} from "@capawesome/capacitor-app-update";
import ms from "ms.macro";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense, } from "with-suspense";

import { client, commitId, siteOrigin } from "~/const";
import { device } from "~/hooks/use-device";
import { useQuery } from "~/query";

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

function useVersionCheck() {
	return useQuery({
		queryKey: ["version-check"],
		queryFn: async () => {
			const response = await fetch(`${siteOrigin}/manifest.json`, { method: "HEAD" });
			return response.headers.get("x-flirtual-version");
		},
		enabled: client,
		refetchInterval: ms("5m"),
		refetchOnWindowFocus: "always",
		staleTime: 0,
		meta: { cacheTime: 0 }
	});
}

export const UpdateInformation: React.FC = withSuspense(() => {
	const { t } = useTranslation();

	const serverVersion = useVersionCheck();
	const webUpdateAvailable = !!serverVersion && serverVersion !== commitId;

	const updateInformation = useQuery({
		queryKey: ["update-information"],
		queryFn: async () => {
			try {
				return await AppUpdate.getAppUpdateInfo();
			}
			catch {
				// Ignore errors (e.g. Google Play isn't available)
				return null;
			}
		},
		enabled: client && device.native,
		refetchInterval: ms("1m"),
		staleTime: 0,
		placeholderData: null,
	});

	useEffect(() => {
		if (
			!updateInformation
			|| updateInformation.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE
		)
			return;

		if (updateInformation.flexibleUpdateAllowed)
			void AppUpdate.startFlexibleUpdate();
	}, [updateInformation]);

	const nativeUpdateAvailable = updateInformation
		&& updateInformation.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE
		&& !updateInformation.flexibleUpdateAllowed;

	if (!webUpdateAvailable && !nativeUpdateAvailable)
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
						<Button
							size="sm"
							onClick={() => {
								if (nativeUpdateAvailable)
									AppUpdate.openAppStore();
								else
									window.location.reload();
							}}
						>
							{t("update")}
						</Button>
					</AlertDialogAction>
				</DialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});
