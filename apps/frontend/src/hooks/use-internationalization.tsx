"use client";

import { Slot } from "@radix-ui/react-slot";
import { createContext, forwardRef, use, type PropsWithChildren } from "react";

import type { getInternationalization } from "~/i18n/request";
export { useTranslations } from "next-intl";

export type Internationalization = Awaited<
	ReturnType<typeof getInternationalization>
>;

export const InternationalizationContext = createContext(
	{} as Internationalization
);

export const InternationalizationProvider = forwardRef<
	HTMLHtmlElement,
	PropsWithChildren<{ value: Internationalization }>
>(({ children, value, ...props }, reference) => {
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

export const useInternationalization = () => {
	const internationalization = use(InternationalizationContext);

	return internationalization;
};
