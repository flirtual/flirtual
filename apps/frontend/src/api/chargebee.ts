import { chargebeeNamespace } from "~/const";

interface ChargebeeInstance {
	openCheckout: (options: {
		hostedPage: () => Promise<unknown>;
		success?: (hostedPageId: string) => void;
		error?: (error: Error) => void;
		close?: () => void;
		step?: (step: string) => void;
	}) => void;
	setPortalSession: (callback: () => Promise<unknown>) => void;
	createChargebeePortal: () => {
		open: (callbacks?: {
			loaded?: () => void;
			close?: () => void;
			visit?: (sectionType: string) => void;
			paymentSourceAdd?: () => void;
			paymentSourceUpdate?: () => void;
			paymentSourceRemove?: () => void;
			subscriptionChanged?: (data: unknown) => void;
			subscriptionCancelled?: (data: unknown) => void;
			subscriptionResumed?: (data: unknown) => void;
			subscriptionPaused?: (data: unknown) => void;
		}) => void;
	};
}

interface ChargebeeStatic {
	init: (options: { site: string }) => ChargebeeInstance;
	getInstance: () => ChargebeeInstance;
}

declare global {
	interface Window {
		Chargebee?: ChargebeeStatic;
	}
}

let loadPromise: Promise<ChargebeeStatic> | null = null;
let instance: ChargebeeInstance | null = null;

function load(): Promise<ChargebeeStatic> {
	if (window.Chargebee) return Promise.resolve(window.Chargebee);
	if (loadPromise) return loadPromise;

	loadPromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://js.chargebee.com/v2/chargebee.js";
		script.async = true;
		script.onload = () => {
			if (!window.Chargebee) {
				loadPromise = null;
				reject(new Error("chargebee.js loaded but Chargebee global is missing"));
				return;
			}
			resolve(window.Chargebee);
		};
		script.onerror = () => {
			loadPromise = null;
			reject(new Error("Failed to load chargebee.js"));
		};
		document.head.append(script);
	});

	return loadPromise;
}

export async function getChargebee(): Promise<ChargebeeInstance> {
	if (instance) return instance;
	const Chargebee = await load();
	instance = Chargebee.init({ site: chargebeeNamespace });
	return instance;
}
