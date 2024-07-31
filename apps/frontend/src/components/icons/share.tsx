import { forwardRef } from "react";
import { Share, Share2 } from "lucide-react";

import { useDevice } from "~/hooks/use-device";

import type { IconComponentProps } from ".";

export const ShareIcon = forwardRef<SVGSVGElement, IconComponentProps>(
	(props, reference) => {
		const { platform } = useDevice();
		return platform === "apple" ? (
			<Share {...props} ref={reference} />
		) : (
			<Share2 {...props} ref={reference} />
		);
	}
);
