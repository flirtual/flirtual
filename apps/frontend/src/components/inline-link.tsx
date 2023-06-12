import { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { isInternalHref } from "~/urls";

type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & {
	href: Url | null;
	highlight?: boolean;
};

export const InlineLink: React.FC<InlineLinkProps> = ({
	href,
	highlight = true,
	...props
}) => {
	return href === null ? (
		<span {...props} />
	) : (
		<Link
			{...props}
			href={href.toString()}
			target={isInternalHref(href) ? "_self" : "_blank"}
			className={twMerge(
				"focus:outline-none hocus:underline",
				highlight && "text-theme-2",
				props.className
			)}
		/>
	);
};
