import { Geolocation } from "@capacitor/geolocation";
import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { isWretchError } from "~/api/common";
import { Profile } from "~/api/user/profile";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey } from "~/query";

export const InputGeolocation: FC = () => {
	const { t } = useTranslation();
	const toasts = useToast();
	const { user } = useSession();
	const { native } = useDevice();

	const [loading, setLoading] = useState(false);

	return (
		<div className="flex gap-2">
			<Button
				disabled={loading}
				size="sm"
				onClick={async () => {
					setLoading(true);
					if (native)
						await Geolocation.requestPermissions({ permissions: ["coarseLocation"] });
					await Geolocation.getCurrentPosition()
						.then((position) =>
							Profile.updateGeolocation(user.id, {
								longitude: position.coords.longitude,
								latitude: position.coords.latitude
							})
						)
						.then(() => toasts.add(t("geolocation_updated")))
						.catch((reason) => {
							if (isWretchError(reason)) {
								toasts.addError(t(`errors.${reason.json.error}` as any));
							}
							else {
								toasts.addError(reason);
							}
						})
						.finally(() => {
							setLoading(false);
							void invalidate({ queryKey: sessionKey() });
						});
				}}
			>
				{loading
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
