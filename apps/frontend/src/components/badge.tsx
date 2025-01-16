import { Slot } from "@radix-ui/react-slot";
import { useTranslations } from "next-intl";
import type { FC, PropsWithChildren, RefAttributes } from "react";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";
import { urls } from "~/urls";

export interface BadgeProps extends PropsWithChildren, RefAttributes<HTMLDivElement> {
	asChild?: boolean;
	white?: boolean;
	small?: boolean;
}

export function Badge({ asChild = false, white = false, small = false, children, ref }: BadgeProps) {
	const Component = asChild ? Slot : "div";

	return (
		<Component
			className={twMerge(
				"focusable flex shrink-0 grow-0 items-center justify-center gap-2 rounded-xl font-bold uppercase",
				white
					? "bg-white-20 text-black-80"
					: "bg-brand-gradient text-white-10 shadow-brand-1",
				small
					? "px-2 text-xs"
					: "px-3 py-1 text-sm"
			)}
			ref={ref}
		>
			{children}
		</Component>
	);
}

export const PremiumBadge: FC = () => {
	const t = useTranslations();

	return (
		<Badge asChild>
			<Link href={urls.subscription.default}>
				{t("premium")}
			</Link>
		</Badge>
	);
};

export const NewBadge: FC<BadgeProps> = ({ children, ...props }) => {
	const t = useTranslations();

	return (
		<Badge {...props}>
			{t("new")}
		</Badge>
	);
};
