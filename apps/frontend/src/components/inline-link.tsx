import { twMerge } from "tailwind-merge";

import { Link } from "./link";

export type InlineLinkProps = {
	highlight?: boolean;
	asChild?: boolean;
} & Parameters<typeof Link>[0];

export const InlineLink: React.FC<InlineLinkProps> = ({
	highlight = true,
	href,
	...props
}) => {
	return (
		<Link
			{...props}
			className={twMerge(
				"data-[external]:touch-callout-default focus:outline-none",
				href && "hocus:underline",
				highlight && "text-theme-2",
				props.className
			)}
			href={href}
		/>
	);
};
