import Link from "next/link";
import { twMerge } from "tailwind-merge";

function isExternalLink(href: string) {
	if (typeof window === "undefined") return true;
	return new URL(href, window.location.origin).origin !== window.location.origin;
}

type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & { href: string };

export const InlineLink: React.FC<InlineLinkProps> = (props) => (
	<Link
		{...props}
		className={twMerge("focus:outline-none hocus:underline", props.className)}
		target={isExternalLink(props.href) ? "_blank" : "_self"}
	/>
);
