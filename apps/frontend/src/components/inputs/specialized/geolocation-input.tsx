import { Geolocation } from "@capacitor/geolocation";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { isWretchError } from "~/api/common";
import { Profile } from "~/api/user/profile";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey, useMutation } from "~/query";

export const InputGeolocation: FC = () => {
	const { t } = useTranslation();
	const toasts = useToast();
	const { user } = useSession();
	const { native } = useDevice();

	const { isPending, mutate } = useMutation({
		mutationFn: async () => {
			if (native)
				await Geolocation.requestPermissions({ permissions: ["coarseLocation"] });

			const position = await Geolocation.getCurrentPosition();
			await Profile.updateGeolocation(user.id, {
				longitude: position.coords.longitude,
				latitude: position.coords.latitude
			});
		},
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
						: t("share_location")}
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
