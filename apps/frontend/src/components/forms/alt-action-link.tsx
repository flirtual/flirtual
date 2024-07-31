import { MoveRight } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";

export const FormAlternativeActionLink: React.FC<
	Omit<React.ComponentProps<"a">, "ref"> & LinkProps
> = ({ children, ...props }) => (
	<Link
		{...props}
		className={twMerge(
			"flex select-none items-center gap-2 font-nunito text-lg text-theme-2 focus:outline-none",
			props.className
		)}
	>
		<MoveRight className="inline w-6 shrink-0" />
		{children}
	</Link>
);
