import {
	AppUpdate,
	AppUpdateAvailability,
} from "@capawesome/capacitor-app-update";
import ms from "ms.macro";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { withSuspense, } from "with-suspense";

import { client, commitId, siteOrigin } from "~/const";
import { device } from "~/hooks/use-device";
import { useQuery } from "~/query";

import { Button } from "./button";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "./dialog/dialog";
import { DrawerOrDialog } from "./drawer-or-dialog";

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
		meta: { cacheTime: 0 },
		placeholderData: null
	});
}

export const UpdateInformationDialog: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(true);

	return (
		<DrawerOrDialog closable className="desktop:max-w-lg" open={open} onOpenChange={setOpen}>
			<>
				<DialogHeader>
					<DialogTitle>{t("early_north_alpaca_sail")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody className="min-h-48">
					<p>
						<Trans
							components={{ strong: <strong className="font-semibold" /> }}
							i18nKey="icy_sound_emu_kiss"
						/>
					</p>
					<div className="flex gap-2">
						<Button className="grow" size="sm" onClick={onUpdate}>
							{t("update")}
						</Button>
						<Button
							className="grow"
							kind="tertiary"
							size="sm"
							onClick={() => setOpen(false)}
						>
							{t("aware_such_leopard_fond")}
						</Button>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};

export const UpdateInformation: React.FC = withSuspense(() => {
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
		<UpdateInformationDialog
			onUpdate={() => {
				if (nativeUpdateAvailable) {
					AppUpdate.openAppStore();
					return;
				}

				window.location.reload();
			}}
		/>
	);
});
