import type { FC, PropsWithChildren } from "react";
import { ShepherdTour } from "react-shepherd";
import type { Tour } from "react-shepherd";

import { emptyArray } from "~/utilities";

const tourOptions = {
	useModalOverlay: true,
	exitOnEsc: false,
	defaultStepOptions: {
		canClickTarget: false,
		cancelIcon: {
			enabled: false
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
