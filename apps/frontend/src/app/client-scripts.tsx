"use client";

import { useEffect } from "react";

export const ClientScripts: React.FC = () => {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", function () {
				void navigator.serviceWorker.register("/sw.js");
			});
		}
	}, []);

	return <></>;
};
