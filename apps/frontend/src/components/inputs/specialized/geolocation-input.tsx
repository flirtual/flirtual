/* eslint-disable react-refresh/only-export-components */
import { Geolocation } from "@capacitor/geolocation";
import { useCallback } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { isWretchError } from "~/api/common";
import { Profile } from "~/api/user/profile";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey, useMutation } from "~/query";

async function captureGeolocation(userId: string, native: boolean) {
	if (native)
		await Geolocation.requestPermissions({ permissions: ["coarseLocation"] });

	const position = await Geolocation.getCurrentPosition();
	await Profile.updateGeolocation(userId, {
		longitude: position.coords.longitude,
		latitude: position.coords.latitude
	});
}

export function useApplyGeolocation() {
	const { user } = useSession();
	const { native } = useDevice();

	const hasLocation = Boolean(user.profile.longitude && user.profile.latitude);

	return useCallback(
		async (enabled: boolean) => {
			if (enabled) return captureGeolocation(user.id, native);
			if (hasLocation) await Profile.deleteGeolocation(user.id);
		},
		[native, user.id, hasLocation]
	);
}

export const InputGeolocation: FC = () => {
	const { t } = useTranslation();
	const toasts = useToast();
	const { user } = useSession();
	const { native } = useDevice();

	const { isPending, mutate } = useMutation({
		mutationFn: () => captureGeolocation(user.id, native),
		onSuccess: () => toasts.add(t("geolocation_updated")),
		onError: (reason) => {
			if (isWretchError(reason)) return toasts.addError(t(`errors.${reason.json.error}` as any));
			toasts.addError(reason);
		},
		onSettled: () => invalidate({ queryKey: sessionKey() })
	});

	return (
		<div className="flex gap-2">
			<Button
				pending={isPending}
				size="sm"
				onClick={() => mutate()}
			>
				{isPending
					? t("updating")
					: user.profile.longitude && user.profile.latitude
						? t("update_location")
						: t("enable_distance_matchmaking")}
			</Button>

			{user.profile.longitude && user.profile.latitude && (
				<Button
					kind="tertiary"
					size="sm"
					onClick={() => {
						Profile.deleteGeolocation(user.id)
							.then(() => toasts.add(t("geolocation_removed")))
							.catch(toasts.addError)
							.finally(() => void invalidate({ queryKey: sessionKey() }));
					}}
				>
					{t("remove")}
				</Button>
			)}
		</div>
	);
};
