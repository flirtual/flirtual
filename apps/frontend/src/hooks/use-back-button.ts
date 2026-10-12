import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useEffectEvent } from "react";

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

		if (canGoBack) history.back();
		else void App.exitApp();
	});
}

export function addBackHandler(handler: () => void) {
	handlers.push(handler);
	return () => void handlers.splice(handlers.indexOf(handler), 1);
}

export function useBackButton(active: boolean, onBack: () => void) {
	const back = useEffectEvent(onBack);

	useEffect(() => {
		if (!active) return;
		return addBackHandler(() => back());
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [active]);
}
