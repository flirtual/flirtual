import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

import { goBack } from "./use-history-tabs";

// Dialogs, drawers, menus and listboxes that are open.
export const openOverlays = ["dialog", "alertdialog", "menu", "listbox"].map((role) => `[role="${role}"][data-state="open"]`).join(", ");

// Chargebee checkout and Freshworks widget. Back is ignored when open.
const thirdPartyOverlays = ["#cb-container", "#freshworks-frame-wrapper"];

function visible(selector: string) {
	const element = document.querySelector<HTMLElement>(selector);
	if (!element) return false;

	const { width, height } = element.getBoundingClientRect();
	const { display, visibility, opacity } = getComputedStyle(element);
	return width > 0 && height > 0 && display !== "none" && visibility !== "hidden" && opacity !== "0";
}

// Android's back button closes the innermost overlay that asked for it before
// going back in history.
const handlers: Array<() => void> = [];

if (Capacitor.getPlatform() === "android") {
	void App.addListener("backButton", ({ canGoBack }) => {
		if (thirdPartyOverlays.some(visible)) return;

		const handler = handlers.at(-1);
		if (handler) return handler();

		// Only the topmost Radix layer handles Escape; those that refuse it ignore back too.
		if (document.querySelector(openOverlays)) {
			document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
			return;
		}

		if (!goBack(canGoBack)) void App.exitApp();
	});
}

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((subscriber) => subscriber());

export function addBackHandler(handler: () => void) {
	handlers.push(handler);
	notify();

	return () => {
		handlers.splice(handlers.indexOf(handler), 1);
		notify();
	};
}

// Whether back would close something or be ignored.
function claimed() {
	return handlers.length > 0 || !!document.querySelector(openOverlays) || thirdPartyOverlays.some(visible);
}

// Third-party overlays show and hide by restyling their containers.
function subscribe(onChange: () => void) {
	const styles = new MutationObserver(onChange);
	const watchStyles = () => {
		styles.disconnect();
		for (const selector of thirdPartyOverlays) {
			const element = document.querySelector(selector);
			if (element) styles.observe(element, { attributeFilter: ["style", "class"] });
		}
	};

	const tree = new MutationObserver(() => {
		watchStyles();
		onChange();
	});
	tree.observe(document.body, { subtree: true, childList: true, attributeFilter: ["data-state"] });
	watchStyles();
	subscribers.add(onChange);

	return () => {
		subscribers.delete(onChange);
		tree.disconnect();
		styles.disconnect();
	};
}

export function useBackClaimed() {
	return useSyncExternalStore(subscribe, claimed, () => false);
}

export function useBackButton(active: boolean, onBack: () => void) {
	const back = useEffectEvent(onBack);

	useEffect(() => {
		if (!active) return;
		return addBackHandler(() => back());
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [active]);
}
