import type { FC, PropsWithChildren } from "react";
import { useState } from "react";
import Shepherd from "shepherd.js";
import type { TourOptions } from "shepherd.js";

import { ShepherdContext } from "./context";

const tourOptions = {
	useModalOverlay: true,
	exitOnEsc: false,
	defaultStepOptions: {
		canClickTarget: false,
		cancelIcon: {
			enabled: false
		}
	}
} satisfies TourOptions;

export const ShepherdProvider: FC<PropsWithChildren> = ({ children }) => {
	const [tour] = useState(() => new Shepherd.Tour(tourOptions));

	return <ShepherdContext value={tour}>{children}</ShepherdContext>;
};
