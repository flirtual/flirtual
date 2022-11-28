import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { siteOrigin } from "~/const";

function isExternalLink(href: string) {
	return new URL(href, siteOrigin).origin !== siteOrigin;
}

type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & { href: string };

export const InlineLink: React.FC<InlineLinkProps> = (props) => (
	<Link
		{...props}
		className={twMerge("focus:outline-none hocus:underline", props.className)}
		target={isExternalLink(props.href) ? "_blank" : "_self"}
	/>
);
