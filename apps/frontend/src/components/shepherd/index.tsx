"use client";

import { ShepherdTour, type Tour } from "react-shepherd";

import type { FC, PropsWithChildren } from "react";

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
