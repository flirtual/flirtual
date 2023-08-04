import { Share, ShareOptions } from "@capacitor/share";
import { useCallback } from "react";
import { Clipboard } from "@capacitor/clipboard";

import { noop } from "~/utilities";

import { useToast } from "./use-toast";

export function useShare() {
	const { add: addToast } = useToast();

	return useCallback(
		async (options: ShareOptions) => {
			await Clipboard.write(
				options.url ? { url: options.url } : { string: options.text }
			);

			if (!(await Share.canShare()).value)
				return addToast("Copied to clipboard");

			await Share.share(options).catch(noop);
		},
		[addToast]
	);
}
