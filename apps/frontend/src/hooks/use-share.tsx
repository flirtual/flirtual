import { Share, type ShareOptions } from "@capacitor/share";
import { useCallback, useEffect, useState } from "react";

import { noop } from "~/utilities";

export function useShare() {
	const [canShare, setCanShare] = useState(false);

	useEffect(() => {
		const checkCanShare = async () => {
			const result = await Share.canShare();
			setCanShare(result.value);
		};
		void checkCanShare();
	}, []);

	const share = useCallback(
		async (options: ShareOptions) => {
			if (canShare) await Share.share(options).catch(noop);
		},
		[canShare]
	);

	return { share, canShare };
}
