"use client";

import { Slot } from "@radix-ui/react-slot";
import { createContext, forwardRef, use, type PropsWithChildren } from "react";

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
	PropsWithChildren<{ value: Internationalization }>
>(({ children, value, ...props }, ref) => {
	return (
		<InternationalizationContext.Provider value={value}>
			<Slot
				{...props}
				ref={ref}
				lang={value.locale.current}
				data-country={value.country || "xx"}
			>
				{children}
			</Slot>
		</InternationalizationContext.Provider>
	);
});

export const useInternationalization = () => {
	const internationalization = use(InternationalizationContext);

	return internationalization;
};
