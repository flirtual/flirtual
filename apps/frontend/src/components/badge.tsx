import { Slot } from "@radix-ui/react-slot";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, PropsWithChildren, RefAttributes } from "react";

import { urls } from "~/urls";

export interface BadgeProps extends PropsWithChildren, RefAttributes<HTMLDivElement> {
	asChild?: boolean;
}

export function Badge({ asChild = false, children, ref }: BadgeProps) {
	const Component = asChild ? Slot : "div";

	return (
		<Component
			className="focusable flex shrink-0 grow-0 gap-2 rounded-xl bg-brand-gradient px-3 py-1 text-sm font-bold uppercase text-white-10 shadow-brand-1"
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
				{t("nimble_solid_spider_fond")}
			</Link>
		</Badge>
	);
};

export const NewBadge: FC = () => {
	const t = useTranslations();
	return <Badge>{t("home_seemly_larva_flip")}</Badge>;
};
