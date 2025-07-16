import { Clipboard } from "@capacitor/clipboard";
import { Slot } from "@radix-ui/react-slot";
import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "~/hooks/use-toast";

export type CopyClickProps = PropsWithChildren<{ value: string | null }>;

export const CopyClick: FC<CopyClickProps> = ({
	value,
	children
}) => {
	const { t } = useTranslation();
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
