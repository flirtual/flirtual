"use client";

import {
	AppUpdate,
	AppUpdateAvailability
} from "@capawesome/capacitor-app-update";
import { useEffect, useState } from "react";

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

const AppUpdater: React.FC = () => {
	const { native } = useDevice();
	const [updateAvailable, setUpdateAvailable] = useState(false);

	useEffect(() => {
		async function update() {
			const updateInfo = await AppUpdate.getAppUpdateInfo();
			if (
				updateInfo.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE
			)
				return;

			if (updateInfo.flexibleUpdateAllowed)
				await AppUpdate.startFlexibleUpdate();
			else setUpdateAvailable(true);
		}
		if (native) void update();
	}, [native]);

	return (
		<>
			{updateAvailable && (
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Update Flirtual?</AlertDialogTitle>
						</AlertDialogHeader>
						<AlertDialogDescription>
							We recommend updating to the latest version of Flirtual to get the
							best experience. You may encounter bugs if you continue using this
							version.
						</AlertDialogDescription>
						<DialogFooter>
							<AlertDialogCancel asChild>
								<Button kind="tertiary" size="sm">
									No thanks
								</Button>
							</AlertDialogCancel>
							<AlertDialogAction asChild>
								<Button
									size="sm"
									onClick={async () => {
										await AppUpdate.openAppStore();
									}}
								>
									Update
								</Button>
							</AlertDialogAction>
						</DialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
};

export default AppUpdater;
