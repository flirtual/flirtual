import { Share, type ShareOptions, type ShareResult } from "@capacitor/share";
import { useCallback } from "react";
import useSWR from "swr";

export function useShare() {
	const { data: canShare } = useSWR(
		"canShare",
		async () => (await Share.canShare()).value,
		{ fallbackData: false }
	);

	return {
		canShare,
		share: useCallback(
			async (options: ShareOptions): Promise<ShareResult> => {
				return Share.share(options);
			},
			[canShare]
		)
	};
}
