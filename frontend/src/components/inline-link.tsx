import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { isInternalHref } from "~/urls";

type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & { href: string };

export const InlineLink: React.FC<InlineLinkProps> = (props) => (
	<Link
		{...props}
		className={twMerge("focus:outline-none hocus:underline", props.className)}
		target={isInternalHref(props.href) ? "_self" : "_blank"}
	/>
);
