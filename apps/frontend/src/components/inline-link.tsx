import { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";

import { isInternalHref } from "~/urls";

type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & {
	href: Url | null;
	highlight?: boolean;
	asChild?: boolean;
};

export const InlineLink: React.FC<InlineLinkProps> = ({
	href,
	highlight = true,
	asChild = false,
	...props
}) => {
	const Component = asChild ? Slot : href === null ? "span" : Link;

	return (
		<Component
			{...props}
			href={href?.toString() ?? "#"}
			target={href && isInternalHref(href) ? "_self" : "_blank"}
			className={twMerge(
				"focus:outline-none hocus:underline",
				highlight && "text-theme-2",
				href && !isInternalHref(href) && "touch-callout-default",
				props.className
			)}
		/>
	);
};
