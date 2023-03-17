import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { isInternalHref } from "~/urls";

type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & {
	href: string;
	highlight?: boolean;
};

export const InlineLink: React.FC<InlineLinkProps> = ({ highlight = true, ...props }) => (
	<Link
		{...props}
		target={isInternalHref(props.href) ? "_self" : "_blank"}
		className={twMerge(
			"focus:outline-none hocus:underline",
			highlight && "text-pink",
			props.className
		)}
	/>
);
