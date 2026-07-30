import {
	AppUpdate,
	AppUpdateAvailability,
} from "@capawesome/capacitor-app-update";
import ms from "ms" with { type: "macro" };
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatches } from "react-router";
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

const browsingRouteIds = new Set([
	// Landing page.
	"app/[locale]/(public)/home/page",
	// Unauthenticated pages, e.g. about, terms.
	"app/[locale]/(app)/(public)/layout",
	// Profiles, discover, likes, matches.
	"app/[locale]/(app)/(authenticated)/(onboarded)/layout"
]);

// Pages under the above layouts which can still have unsaved work.
const unsavedWorkRouteIds = new Set([
	"app/[locale]/(app)/(public)/confirm-email/page",
	"app/[locale]/(app)/(authenticated)/(onboarded)/matches/[conversationId]/page"
]);

function useBrowsingOnly() {
	const matches = useMatches();

	return (
		matches.some(({ id }) => browsingRouteIds.has(id))
		&& !matches.some(({ id }) => unsavedWorkRouteIds.has(id))
	);
}

export const UpdateInformationDialog: React.FC<{ native: boolean; onUpdate: () => void }> = ({ native, onUpdate }) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(true);
	const browsingOnly = useBrowsingOnly();

	return (
		<DrawerOrDialog closable className="desktop:max-w-lg" open={open} onOpenChange={setOpen}>
			<>
				<DialogHeader>
					<DialogTitle>{t("update_available")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody className="min-h-48">
					<p>
						{native
							? browsingOnly
								? t("update_available_description_native")
								: t("update_available_description_native_unsaved", { platform: device.platform })
							: browsingOnly
								? t("update_available_description_web")
								: t("update_available_description_web_unsaved")}
					</p>
					<div className="flex gap-2">
						<Button className="grow" size="sm" onClick={onUpdate}>
							{native ? t("update") : t("refresh")}
						</Button>
						<Button
							className="grow"
							kind="tertiary"
							size="sm"
							onClick={() => setOpen(false)}
						>
							{t("not_now")}
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
			native={!!nativeUpdateAvailable}
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
