"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { App, URLOpenListenerEvent } from "@capacitor/app";

const AppUrlListener: React.FC = () => {
	const history = useRouter();
	useEffect(() => {
		void App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
			const slug = event.url.split(".app").pop();
			if (slug) {
				history.push(slug);
			}
		});
	}, [history]);

	return null;
};

export default AppUrlListener;
