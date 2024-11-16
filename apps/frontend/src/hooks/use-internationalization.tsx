/* eslint-disable react-refresh/only-export-components */
"use client";

import { Slot } from "@radix-ui/react-slot";
import type { AbstractIntlMessages } from "next-intl";
import { createContext, forwardRef, type PropsWithChildren, use } from "react";

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
	);
});

InternationalizationProvider.displayName = "InternationalizationProvider";

export function useInternationalization() {
	const internationalization = use(InternationalizationContext);

	return internationalization;
}
