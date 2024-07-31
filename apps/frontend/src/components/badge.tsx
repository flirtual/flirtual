import { Slot } from "@radix-ui/react-slot";
import Link from "next/link";
import { type FC, forwardRef, type PropsWithChildren } from "react";

import { urls } from "~/urls";

export interface BadgeProps extends PropsWithChildren {
	asChild?: boolean;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
	({ asChild = false, children }, ref) => {
		const Component = asChild ? Slot : "div";

		return (
			<Component
				ref={ref}
				className="focusable flex shrink-0 grow-0 gap-2 rounded-xl bg-brand-gradient px-3 py-1 text-sm font-bold uppercase text-white-10 shadow-brand-1"
			>
				{children}
			</Component>
		);
	}
);

export const PremiumBadge: FC = () => (
	<Badge asChild>
		<Link href={urls.subscription.default}>Premium</Link>
	</Badge>
);

export const NewBadge: FC = () => <Badge>NEW</Badge>;
