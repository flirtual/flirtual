import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "../../icons";

export interface PillProps {
	Icon?: IconComponent;
	active?: boolean;
	href?: string;
	children: React.ReactNode;
}

export const Pill: React.FC<PillProps> = ({ Icon, active = false, href, ...props }) => {
	const Element = href ? Link : "div";

	return (
		<Element
			{...props}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			href={href!}
			className={twMerge(
				"flex h-8 select-none items-center gap-2 rounded-xl py-1 px-4 font-montserrat font-semibold shadow-brand-1",
				href && "pointer-events-auto",
				active
					? "bg-brand-gradient text-white-10"
					: "bg-white-30 text-black-70 dark:bg-black-70 dark:text-white-20 sm:dark:bg-black-60"
			)}
		>
			{Icon && <Icon className="h-4" />}
			{props.children}
		</Element>
	);
};
