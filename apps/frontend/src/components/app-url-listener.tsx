"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

const AppUrlListener: React.FC = () => {
	const history = useRouter();
	useEffect(() => {
		void App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
			const slug = event.url.split(".app").pop();
			if (slug) {
				history.push(slug);
			}
			await Browser.close();
		});
	}, [history]);

	return null;
};

export default AppUrlListener;
