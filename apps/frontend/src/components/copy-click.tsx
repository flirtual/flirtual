"use client";

import { Clipboard } from "@capacitor/clipboard";
import { Slot } from "@radix-ui/react-slot";
import { useTranslations } from "next-intl";
import type { FC, PropsWithChildren } from "react";

import { useToast } from "~/hooks/use-toast";

export const CopyClick: FC<PropsWithChildren<{ value: string | null }>> = ({
	value,
	children
}) => {
	const t = useTranslations();
	const toasts = useToast();

	if (value === null) return children;

	return (
		<Slot
			data-copy-click
			className="cursor-pointer"
			onClick={() =>
				Clipboard.write({ string: value }).then(() =>
					toasts.add(t("loose_fancy_marlin_zip"))
				)}
		>
			{children}
		</Slot>
	);
};
