import { Clipboard } from "@capacitor/clipboard";
import { useTranslation } from "react-i18next";

import { device } from "~/hooks/use-device";
import { useToast } from "~/hooks/use-toast";

export function useCopy() {
	const { t } = useTranslation();
	const toasts = useToast();

	return (value: string) => Clipboard.write({ string: value }).then(() => {
		// Android 13 and later confirm copies themselves, with a preview of what was copied.
		if (device.native && device.android && (device.androidSDKVersion ?? 0) >= 33) return;
		toasts.add(t("copied_to_clipboard"));
	});
}
