import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import Link, { LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";

export const FormAlternativeActionLink: React.FC<
	Omit<React.ComponentProps<"a">, "ref"> & LinkProps
> = ({ children, ...props }) => (
	<Link
		{...props}
		className={twMerge("flex items-center gap-2 font-nunito text-lg", props.className)}
	>
		<ArrowLongRightIcon className="inline w-6 shrink-0" />
		{children}
	</Link>
);
