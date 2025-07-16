import type { FC, PropsWithChildren } from "react";
import { ShepherdTour, type Tour } from "react-shepherd";

import { emptyArray } from "~/utilities";

const tourOptions = {
	useModalOverlay: true,
	defaultStepOptions: {
		canClickTarget: false,
		cancelIcon: {
			enabled: true
		}
	}
} satisfies Tour.TourOptions;

export const ShepherdProvider: FC<PropsWithChildren> = ({ children }) => {
	return (
		<ShepherdTour steps={emptyArray} tourOptions={tourOptions}>
			{children}
		</ShepherdTour>
	);
};
