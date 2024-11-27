/* eslint-disable react-refresh/only-export-components */
"use client";

import { Slot } from "@radix-ui/react-slot";
import type { AbstractIntlMessages } from "next-intl";
import type { PropsWithChildren, RefAttributes } from "react";
import { createContext, use } from "react";

import type { getInternationalization } from "~/i18n";

export { useTranslations } from "next-intl";

export type Internationalization = Awaited<
	ReturnType<typeof getInternationalization>
>;

export const InternationalizationContext = createContext(
	{} as Internationalization
);

export interface InternationalizationProviderProps extends PropsWithChildren, RefAttributes<HTMLHtmlElement> {
	value: Internationalization;
	messages: AbstractIntlMessages;
}

export function InternationalizationProvider({ children, value, messages, ...props }: InternationalizationProviderProps) {
	return (
		<InternationalizationContext value={value}>
			<Slot
				{...props}
				data-country={value.country || "xx"}
				lang={value.locale.current}
			>
				{children}
			</Slot>
		</InternationalizationContext>
	);
}

InternationalizationProvider.displayName = "InternationalizationProvider";

export function useInternationalization() {
	const internationalization = use(InternationalizationContext);

	return internationalization;
}
