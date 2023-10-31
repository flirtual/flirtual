import { forwardRef } from "react";
import { Share, Share2 } from "lucide-react";

import { useDevice } from "~/hooks/use-device";

import { IconComponentProps } from ".";

export const ShareIcon = forwardRef<SVGSVGElement, IconComponentProps>(
	(props, reference) => {
		const { platform, userAgent } = useDevice();
		return platform === "ios" || userAgent.os.name === "Mac OS" ? (
			<Share {...props} ref={reference} />
		) : (
			<Share2 {...props} ref={reference} />
		);
	}
);
