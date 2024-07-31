import { Slot } from "@radix-ui/react-slot";
import { Clipboard } from "@capacitor/clipboard";

import { useToast } from "~/hooks/use-toast";

import type { PropsWithChildren } from "react";
import type { FC } from "react";

export const CopyClick: FC<PropsWithChildren<{ value: string }>> = ({
	value,
	children
}) => {
	const toasts = useToast();

	return (
		<Slot
			className="cursor-pointer"
			onClick={async () => {
				await Clipboard.write({ string: value });
				toasts.add("Copied to clipboard");
			}}
		>
			{children}
		</Slot>
	);
};
