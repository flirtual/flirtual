import { Clipboard } from "@capacitor/clipboard";
import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { useToast } from "~/hooks/use-toast";

export type CopyClickProps = { value: string | null; asChild?: boolean } & ComponentProps<"span">;

export const CopyClick: FC<CopyClickProps> = ({
	value,
	children,
	asChild = true,
	className,
	...props
}) => {
	const { t } = useTranslation();
	const toasts = useToast();

	const Component = asChild ? Slot : "span";
	if (value === null) return children;

	return (
		<Component
			{...props}
			data-copy-click
			className={twMerge("cursor-pointer", className)}
			onClick={() =>
				Clipboard.write({ string: value }).then(() =>
					toasts.add(t("loose_fancy_marlin_zip"))
				)}
		>
			{children}
		</Component>
	);
};
