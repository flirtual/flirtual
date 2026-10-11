import type { FC, PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import Shepherd from "shepherd.js";
import type { TourOptions } from "shepherd.js";

import { nativeNavigation } from "~/hooks/use-device";
import { NativeNavigationPlugin } from "~/native-navigation";

import { centerInTourArea, withinTourArea } from "./area";
import { ShepherdContext } from "./context";

const tourOptions = {
	useModalOverlay: true,
	exitOnEsc: false,
	defaultStepOptions: {
		canClickTarget: false,
		cancelIcon: {
			enabled: false
		},
		floatingUIOptions: {
			middleware: [withinTourArea]
		}
	}
} satisfies TourOptions;

export const ShepherdProvider: FC<PropsWithChildren> = ({ children }) => {
	const [tour] = useState(() => new Shepherd.Tour(tourOptions));

	useEffect(() => {
		const { dataset } = document.documentElement;

		const show = () => {
			dataset.tour = "";
			delete dataset.tourNavigation;
			centerInTourArea();
		};
		const end = () => {
			delete dataset.tour;
			delete dataset.tourNavigation;
		};

		// Folding or rotating moves the tab bar and panes; re-show once the layout settles.
		let reshow: ReturnType<typeof setTimeout> | undefined;
		const relayout = () => {
			if (!tour.isActive()) return;
			centerInTourArea();

			clearTimeout(reshow);
			reshow = setTimeout(() => {
				const step = tour.getCurrentStep();
				if (tour.isActive() && step) void tour.show(step.id);
			}, 250);
		};

		tour.on("show", show);
		tour.on("complete", end);
		tour.on("cancel", end);
		window.addEventListener("resize", relayout);
		const layout = nativeNavigation ? NativeNavigationPlugin.addListener("layout", relayout) : null;

		return () => {
			clearTimeout(reshow);
			tour.off("show", show);
			tour.off("complete", end);
			tour.off("cancel", end);
			window.removeEventListener("resize", relayout);
			void layout?.then((handle) => handle.remove());
		};
	}, [tour]);

	return <ShepherdContext value={tour}>{children}</ShepherdContext>;
};
