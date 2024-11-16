"use client";

import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { useCallback, useEffect } from "react";

async function removeCapacitorListeners() {
	await App.removeAllListeners();
}

const AppUrlListener: React.FC = () => {
	const addCapacitorListeners = useCallback(async () => {
		await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
			const url = new URL(event.url);
			const pathname = url.href.replace(url.origin, "");

			location.href = pathname;
		});
	}, []);

	useEffect(() => {
		void addCapacitorListeners();
		return () => void removeCapacitorListeners();
	}, [addCapacitorListeners]);

	return null;
};

export default AppUrlListener;
