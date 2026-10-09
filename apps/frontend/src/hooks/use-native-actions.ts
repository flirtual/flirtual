import { useEffect, useEffectEvent, useState } from "react";

import { NativeNavigationPlugin } from "~/native-navigation";
import type { NativeNavigationAction } from "~/native-navigation";

import { nativeNavigation } from "./use-device";

// Dialogs, drawers and menus the page opens over its own buttons.
const overlays = ["dialog", "alertdialog", "menu", "listbox"].map((role) => `[role="${role}"][data-state="open"]`).join(", ");

// Unknown until the first call: builds from before native actions don't have the method.
let supported = nativeNavigation ? undefined : false;

// Shows the actions as native buttons where `element` lays them out, for as long as it's mounted.
// Returns whether the page's own buttons should hide, which they also do while that's unknown.
export function useNativeActions(
	element: HTMLElement | null,
	actions: Array<NativeNavigationAction>,
	onAction: (id: string) => void
) {
	const [native, setNative] = useState(supported !== false);
	const serialized = JSON.stringify(actions);

	useEffect(() => {
		if (!element || supported === false) return;

		let sent = "";
		const send = () => {
			const { x, y, width, height } = element.getBoundingClientRect();
			const frame = { x, y, width, height };
			// Native views draw over the whole page, so nothing the page opens can cover them.
			const covered = !!document.querySelector(overlays);
			const key = JSON.stringify([frame, covered]);
			if (key === sent) return;
			sent = key;

			NativeNavigationPlugin.actions({ actions: covered ? [] : JSON.parse(serialized) as Array<NativeNavigationAction>, frame })
				.then(() => {
					supported = true;
					setNative(true);
				})
				.catch(() => {
					supported = false;
					setNative(false);
				});
		};

		// The page can move them without resizing them, as when the tab bar's safe area arrives, so
		// after anything that might, this follows them until they settle.
		let frame = 0;
		let until = 0;
		const follow = () => {
			until = performance.now() + 1000;
			if (frame) return;

			const step = () => {
				send();
				frame = performance.now() < until ? requestAnimationFrame(step) : 0;
			};
			step();
		};

		follow();

		const observer = new ResizeObserver(follow);
		observer.observe(element);
		window.addEventListener("resize", follow);
		const layout = NativeNavigationPlugin.addListener("layout", follow);

		const opened = new MutationObserver(send);
		opened.observe(document.body, { subtree: true, childList: true, attributeFilter: ["data-state"] });

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			opened.disconnect();
			window.removeEventListener("resize", follow);
			void layout.then((handle) => handle.remove());
		};
	}, [element, serialized]);

	useEffect(() => () => {
		if (supported) void NativeNavigationPlugin.actions({ actions: [] });
	}, []);

	const select = useEffectEvent((id: string) => onAction(id));

	useEffect(() => {
		if (supported === false) return;

		const listener = NativeNavigationPlugin.addListener("action", ({ id }) => select(id));
		return () => void listener.then((handle) => handle.remove());
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return native;
}
