"use client";

import { Slot } from "@radix-ui/react-slot";
import { Clipboard } from "@capacitor/clipboard";
import { useTranslations } from "next-intl";

import { useToast } from "~/hooks/use-toast";

import type { PropsWithChildren, FC } from "react";

export const CopyClick: FC<PropsWithChildren<{ value: string }>> = ({
	value,
	children
}) => {
	const t = useTranslations();
	const toasts = useToast();

	return (
		<Slot
			className="cursor-pointer"
			onClick={() =>
				Clipboard.write({ string: value }).then(() =>
					toasts.add(t("loose_fancy_marlin_zip"))
				)
			}
		>
			{children}
		</Slot>
	);
};
