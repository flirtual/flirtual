import { Slot } from "@radix-ui/react-slot";
import type { FC, PropsWithChildren, RefAttributes } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";
import { urls } from "~/urls";

export interface BadgeProps extends PropsWithChildren, RefAttributes<HTMLDivElement> {
	asChild?: boolean;
	white?: boolean;
	small?: boolean;
	className?: string;
}

export function Badge({
	asChild = false,
	white = false,
	small = false,
	className,
	children,
	ref
}: BadgeProps) {
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
					: "px-3 py-1 text-sm",
				className,
			)}
			ref={ref}
		>
			{children}
		</Component>
	);
}

export const PremiumBadge: FC = () => {
	const { t } = useTranslation();

	return (
		<Badge asChild>
			<Link href={urls.subscription.default}>
				{t("premium")}
			</Link>
		</Badge>
	);
};

export const NewBadge: FC<BadgeProps> = ({ className, children, ...props }) => {
	const { t } = useTranslation();

	return (
		<Badge className={twMerge("self-stretch uppercase", className)} {...props}>
			{t("new")}
		</Badge>
	);
};
