import { Share, ShareOptions } from "@capacitor/share";
import { useCallback } from "react";

import { useToast } from "./use-toast";

export function useShare() {
	const { addError } = useToast();
	return useCallback(
		(options: ShareOptions) => Share.share(options).catch(addError),
		[addError]
	);
}
