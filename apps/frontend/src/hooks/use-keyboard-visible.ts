import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useEffect, useState } from "react";

export function useKeyboardVisible() {
	const [keyboardVisible, setKeyboardVisible] = useState(false);

	useEffect(() => {
		if (!Capacitor.isPluginAvailable("Keyboard")) return;

		const editing = () => !!document.activeElement?.matches("input, textarea, select, [contenteditable]");

		// For some reason, iPhone Duo sends keyboardWillShow on rotation, and we need to ignore it.
		const showListener = Keyboard.addListener("keyboardWillShow", () => {
			if (editing()) setKeyboardVisible(true);
		});

		const hideListener = Keyboard.addListener("keyboardWillHide", () => {
			setKeyboardVisible(false);
		});

		// The hide event can be missed, and the viewport resizes whenever the keyboard does.
		const onResize = () => {
			if (!editing()) setKeyboardVisible(false);
		};
		window.addEventListener("resize", onResize);

		return () => {
			window.removeEventListener("resize", onResize);
			void Promise.all([
				showListener.then((listener) => listener.remove()),
				hideListener.then((listener) => listener.remove())
			]);
		};
	}, []);

	return keyboardVisible;
}
