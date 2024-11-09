"use client";

import { Slot } from "@radix-ui/react-slot";
import * as Sentry from "@sentry/nextjs";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { createContext, forwardRef, type PropsWithChildren, use, useEffect } from "react";

import type { getInternationalization } from "~/i18n";

export { useTranslations } from "next-intl";

export type Internationalization = Awaited<
	ReturnType<typeof getInternationalization>
>;

export const InternationalizationContext = createContext(
	{} as Internationalization
);

export const InternationalizationProvider = forwardRef<
	HTMLHtmlElement,
	PropsWithChildren<{ value: Internationalization; messages: AbstractIntlMessages }>
>(({ children, value, messages, ...props }, reference) => {
	return (
		<NextIntlClientProvider
			locale={value.locale.current}
			messages={messages}
			timeZone={value.timezone}
			onError={(reason) => {
				Sentry.captureException(reason, {
					mechanism
				});
			}}
		>
			<InternationalizationContext.Provider value={value}>
				<Slot
					{...props}
					data-country={value.country || "xx"}
					lang={value.locale.current}
					ref={reference}
				>
					{children}
				</Slot>
			</InternationalizationContext.Provider>
		</NextIntlClientProvider>
	);
});

InternationalizationProvider.displayName = "InternationalizationProvider";

export function useInternationalization() {
	const internationalization = use(InternationalizationContext);

	return internationalization;
}
