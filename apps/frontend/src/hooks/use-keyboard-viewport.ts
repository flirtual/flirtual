import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useEffect } from "react";

const minKeyboardHeight = 50;

// Set on the root directly, since React would apply them a frame late.
export function useKeyboardViewport() {
	useEffect(() => {
		if (!Capacitor.isPluginAvailable("Keyboard")) return;

		const { style } = document.documentElement;
		const editing = () => !!document.activeElement?.matches("input, textarea, select, [contenteditable]");

		let shown = false;
		// WebKit can briefly report the shrunken page again after it grows back.
		let grown = false;
		let width = window.innerWidth;
		let fullHeight = window.innerHeight;

		const update = () => {
			const height = window.innerHeight;
			if (!shown || window.innerWidth !== width) fullHeight = height;
			width = window.innerWidth;
			fullHeight = Math.max(fullHeight, height);

			const keyboardHeight = fullHeight - height;
			if (shown && !editing() && keyboardHeight < minKeyboardHeight) grown = true;

			if (!grown && keyboardHeight >= minKeyboardHeight) style.setProperty("--keyboard-safe-area-inset-bottom", "0px");
			else style.removeProperty("--keyboard-safe-area-inset-bottom");

			if (grown) style.setProperty("--viewport-height", `${fullHeight}px`);
			else style.removeProperty("--viewport-height");
		};

		// For some reason, iPhone Duo sends keyboardWillShow on rotation, and we need to ignore it.
		const showListener = Keyboard.addListener("keyboardWillShow", () => {
			if (!editing()) return;
			shown = true;
			grown = false;
			update();
		});

		const hideListener = Keyboard.addListener("keyboardDidHide", () => {
			shown = false;
			grown = false;
			update();
		});

		// The page can grow back with only the visual viewport reporting it.
		window.addEventListener("resize", update);
		window.visualViewport?.addEventListener("resize", update);

		return () => {
			window.removeEventListener("resize", update);
			window.visualViewport?.removeEventListener("resize", update);
			style.removeProperty("--keyboard-safe-area-inset-bottom");
			style.removeProperty("--viewport-height");
			void Promise.all([
				showListener.then((listener) => listener.remove()),
				hideListener.then((listener) => listener.remove())
			]);
		};
	}, []);
}
