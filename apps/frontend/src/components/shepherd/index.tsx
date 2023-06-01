"use client";

import { FC, PropsWithChildren } from "react";
import { ShepherdTour, Tour } from "react-shepherd";

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
		<ShepherdTour steps={[]} tourOptions={tourOptions}>
			{children}
		</ShepherdTour>
	);
};
