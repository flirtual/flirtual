import { Share, type ShareOptions, type ShareResult } from "@capacitor/share";
import { useCallback } from "react";

import { useQuery } from "~/query";

export function useShare() {
	const canShare = useQuery({
		queryKey: ["canShare"],
		queryFn: async () => (await Share.canShare().catch(() => ({ value: false }))).value,
		placeholderData: false,
		meta: {
			cacheTime: 0
		}
	});

	return {
		canShare,
		share: useCallback(async (options: ShareOptions): Promise<ShareResult> => {
			return Share.share(options);
		}, [])
	};
}
