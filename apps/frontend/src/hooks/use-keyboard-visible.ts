import { Keyboard } from "@capacitor/keyboard";
import { useEffect, useState } from "react";

import { client } from "~/const";

export function useKeyboardVisible() {
	const [keyboardVisible, setKeyboardVisible] = useState(false);

	useEffect(() => {
		if (!client) return;

		const showListener = Keyboard.addListener("keyboardWillShow", () => {
			setKeyboardVisible(true);
		});

		const hideListener = Keyboard.addListener("keyboardWillHide", () => {
			setKeyboardVisible(false);
		});

		return () => void Promise.all([
			showListener.then((listener) => listener.remove()),
			hideListener.then((listener) => listener.remove())
		]);
	}, []);

	return keyboardVisible;
}
