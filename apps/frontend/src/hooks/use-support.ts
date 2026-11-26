import { useCallback, useEffect } from "react";

import type { Session } from "~/api/auth";
import { freshdeskWebChat, freshworksWidgetId } from "~/const";
import { useLocale } from "~/i18n";
import type { AnyLocale } from "~/i18n/languages";
import { queryClient, sessionKey } from "~/query";

interface WebChatOptions {
	host: string;
	token: string;
	widgetId: string;
	open?: boolean;
	contactProperties?: Record<string, string>;
	config?: Record<string, unknown>;
}

declare global {
	interface Window {
		fwSettings: Record<string, unknown>;
		FreshworksWidget: {
			(...arguments_: Array<unknown>): void;
			q: Array<unknown>;
		};
		fdWidget?: {
			init: (options: WebChatOptions) => void;
			reInit: (options: WebChatOptions) => void;
			open: () => void;
			close: () => void;
			isOpen: () => boolean;
			isInitialized: () => boolean;
		};
	}
}

function currentUser() {
	const user = queryClient.getQueryData<Session>(sessionKey())?.user;
	return {
		name: user ? user.profile.displayName || user.slug : "",
		email: user?.email || ""
	};
}

let widgetLoaded = false;

function loadWidget() {
	if (widgetLoaded) return;

	const script = document.createElement("script");
	script.src = `https://widget.freshworks.com/widgets/${freshworksWidgetId}.js`;

	document.body.append(script);
	widgetLoaded = true;
}

function openWidget() {
	window.FreshworksWidget("identify", "ticketForm", currentUser());
	window.FreshworksWidget("open");
	window.FreshworksWidget("hide", "launcher");
}

// https://developers.freshdesk.com/web-chat-api/#multilingual-configuration
const webChatLanguages: Record<AnyLocale, string> = {
	en: "en",
	de: "de",
	es: "es-LA",
	fr: "fr",
	ja: "ja",
	ko: "ko",
	nl: "nl",
	pt: "pt-PT",
	"pt-BR": "pt-PT",
	ru: "ru",
	sv: "sv"
};

const webChatScriptId = "Freshdesk-js-sdk";
let webChatContact: string | undefined;

export function webChatOpen() {
	return !!window.fdWidget?.isInitialized() && window.fdWidget.isOpen();
}

export function clearWebChat() {
	if (!freshdeskWebChat) return;
	const { token } = freshdeskWebChat;

	try {
		Object.keys(localStorage)
			.filter((key) => key.startsWith(token) || key.startsWith(`lsds_${token}`))
			.forEach((key) => localStorage.removeItem(key));
	}
	catch {}
}

function openWebChat(locale: AnyLocale) {
	if (!freshdeskWebChat) return;

	const { name, email } = currentUser();
	const contactProperties = Object.fromEntries(
		Object.entries({ name, email, language: webChatLanguages[locale] }).filter(([, value]) => value)
	);

	const options: WebChatOptions = {
		...freshdeskWebChat,
		open: true,
		contactProperties,
		config: { headerProperty: { hideChatButton: true } }
	};

	const contact = JSON.stringify(contactProperties);
	const { fdWidget } = window;

	if (fdWidget?.isInitialized()) {
		if (contact === webChatContact) return fdWidget.open();

		webChatContact = contact;
		return fdWidget.reInit(options);
	}

	if (document.getElementById(webChatScriptId)) return;

	const script = document.createElement("script");
	script.id = webChatScriptId;
	script.async = true;
	script.src = new URL("/webchat/js/widget.js", freshdeskWebChat.host).href;
	script.addEventListener("load", () => {
		webChatContact = contact;
		window.fdWidget?.init(options);
	});
	script.addEventListener("error", () => script.remove());

	document.head.append(script);
}

export function useSupport() {
	const [locale] = useLocale();

	useEffect(() => {
		if (freshdeskWebChat || !freshworksWidgetId) return;

		if (typeof window.FreshworksWidget !== "function") {
			window.FreshworksWidget = Object.assign(
				(...parameters: Array<unknown>) => {
					loadWidget();
					window.FreshworksWidget.q.push(parameters);
				},
				{ q: [] }
			);
		}

		window.fwSettings = { widget_id: freshworksWidgetId, locale };
	}, [locale]);

	const openSupport = useCallback(
		() => (freshdeskWebChat ? openWebChat(locale) : openWidget()),
		[locale]
	);

	return { openSupport };
}
