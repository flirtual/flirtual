import { Share, Share2 } from "lucide-react";

import { useDevice } from "~/hooks/use-device";

import type { IconComponentProps } from ".";

export function ShareIcon(props: IconComponentProps) {
	const { platform } = useDevice();
	const Component = platform === "apple" ? Share : Share2;

	return <Component {...props} />;
}
