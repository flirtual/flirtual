import { motion } from "motion/react";
import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";
import { useLocation } from "~/hooks/use-location";
import { usePreferences } from "~/hooks/use-preferences";
import { toAbsoluteUrl, urlEqual } from "~/urls";

export interface NavigationalSwitchItemProps {
	href: string;
	Icon: FC<ComponentProps<"svg">>;
	className?: string;
	strict?: boolean;
	id?: string;
}

export const NavigationalSwitchItem: FC<NavigationalSwitchItemProps> = ({
	Icon,
	className,
	strict,
	...props
}) => {
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(props.href), location, strict);

	const [rankedMode] = usePreferences("ranked_mode", false);
	const { t } = useTranslation();

	return (
		<Link
			{...props}
			className={twMerge(
				"group relative flex shrink-0 items-center gap-2 rounded-full p-2 focus:outline-none",
				className,
			)}
			data-active={active ? "" : undefined}
		>
			{active && (
				<motion.div
					className={twMerge(
						"absolute inset-0 rounded-full bg-black-90 bg-brand-gradient shadow-brand-1 transition-colors",
						rankedMode && props.id === "date-mode-switch" && "!bg-[url('https://static.flirtual.com/ranked.jpg')] bg-cover bg-center"
					)}
					transition={{
						type: "spring",
						duration: 0.5,
						ease: "easeInOut",
						bounce: 0.25
					}}
					layoutId="switch-indicator"
				/>
			)}
			<Icon className={twMerge("z-10 aspect-square h-6 desktop:h-8", active && "fill-white-10")} />
			{(rankedMode && (props.id === "date-mode-switch" || props.id === "homie-mode-switch") && (
				<span className={twMerge(
					"z-10 pr-2",
					active ? "text-white-20" : "group-hocus:text-white-20 hidden text-black-70 dark:text-white-20 desktop:block"
				)}
				>
					{t(props.id === "date-mode-switch" ? "ranked" : "casual")}
				</span>
			))}
		</Link>
	);
};

export const NavigationItem: FC<
	{ href: string; ref?: any } & ComponentProps<"a">
> = ({ children, ...props }) => {
	const location = useLocation();
	const active
		= toAbsoluteUrl(props.href).pathname.split("/")[1]
			=== location.pathname.split("/")[1];

	return (
		<Link
			{...props}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none",
				active
					? "bg-white-20 text-black-70 shadow-brand-1"
					: "hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1",
				props.className
			)}
		>
			{children}
		</Link>
	);
};
