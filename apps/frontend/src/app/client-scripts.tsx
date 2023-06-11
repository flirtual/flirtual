"use client";

import Script from "next/script";
import { useEffect } from "react";

import { uploadcarePublicKey } from "~/const";

declare global {
	interface Window {
		Blinkloader: {
			optimize: (options: unknown) => void;
		};
	}
}

export const ClientScripts: React.FC = () => {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", function () {
				void navigator.serviceWorker.register("/sw.js");
			});
		}
	}, []);

	return (
		<Script
			src="https://media.flirtu.al/libs/blinkloader/3.x/blinkloader.min.js"
			onReady={() => {
				window.Blinkloader.optimize({
					pubkey: uploadcarePublicKey,
					cdnBase: "https://media.flirtu.al",
					lazyload: false,
					smartCompression: true,
					retina: true,
					webp: true,
					responsive: true,
					fadeIn: true
				});
			}}
		/>
	);
};
