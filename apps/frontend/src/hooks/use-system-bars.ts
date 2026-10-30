import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";
import { useEffect } from "react";

import { device } from "./use-device";

const darkAt = (x: number, y: number) => !!document.elementFromPoint(x, y)?.closest("[data-dark-backdrop]");

// Android's system bars follow the theme, except over elements marked data-dark-backdrop, like
// a brand gradient or profile photo, where their icons are always light.
export function useSystemBarsTheme(dark: boolean) {
	useEffect(() => {
		if (!device.native || !device.android || !Capacitor.isPluginAvailable("SystemBars")) return;

		const current = new Map<SystemBarType, SystemBarsStyle>();
		let frame: number | undefined;

		const set = (bar: SystemBarType, backdrop: boolean) => {
			const style = backdrop ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
			if (current.get(bar) === style) return;

			current.set(bar, style);
			void SystemBars.setStyle({ bar, style });
		};

		const update = () => {
			frame = undefined;

			// Dark theme never needs the light style.
			if (dark) {
				set(SystemBarType.StatusBar, true);
				set(SystemBarType.NavigationBar, true);
				return;
			}

			const style = getComputedStyle(document.documentElement);
			const [top, right, bottom, left] = ["top", "right", "bottom", "left"]
				.map((side) => Number.parseFloat(style.getPropertyValue(`--safe-area-inset-${side}`)) || 0);

			set(SystemBarType.StatusBar, !!top && darkAt(innerWidth / 2, top / 2));

			// In landscape, the navigation bar can run down either side instead.
			set(SystemBarType.NavigationBar, bottom >= Math.max(left, right)
				? !!bottom && darkAt(innerWidth / 2, innerHeight - bottom / 2)
				: left > right
					? darkAt(left / 2, innerHeight / 2)
					: darkAt(innerWidth - right / 2, innerHeight / 2));
		};

		const schedule = () => {
			frame ??= requestAnimationFrame(update);
		};

		schedule();

		// Rotating resets the bars' styles natively, so they're sent again.
		const resend = () => {
			current.clear();
			schedule();
		};
		window.addEventListener("resize", resend);

		const observer = new MutationObserver(schedule);
		const events = ["scroll", "transitionend", "animationend"] as const;

		if (!dark) {
			observer.observe(document.body, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ["class", "data-state", "hidden"]
			});

			for (const event of events) window.addEventListener(event, schedule, { capture: true, passive: true });
		}

		return () => {
			window.removeEventListener("resize", resend);
			observer.disconnect();
			for (const event of events) window.removeEventListener(event, schedule, { capture: true });
			if (frame !== undefined) cancelAnimationFrame(frame);
		};
	}, [dark]);
}
