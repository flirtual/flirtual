import { m } from "motion/react";
import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import RankedImage from "virtual:remote/ranked.jpg";

import { Link } from "~/components/link";
import { usePreferences } from "~/hooks/use-preferences";
import { useMatch } from "~/i18n";

export interface NavigationalSwitchItemProps {
	href: string;
	Icon: FC<ComponentProps<"svg">>;
	iconClassName?: string;
	className?: string;
	strict?: boolean;
	id?: string;
}

export const NavigationalSwitchItem: FC<NavigationalSwitchItemProps> = ({
	Icon,
	iconClassName,
	className,
	strict,
	href,
	...props
}) => {
	const active = useMatch({ path: href });

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
			href={href}
		>
			{active && (
				<m.div
					style={{
						originY: "0px",
						...(rankedMode && props.id === "date-mode-switch"
							? {
									backgroundImage: `url(${RankedImage})`,
									backgroundSize: "cover",
									backgroundPosition: "center"
								}
							: undefined)
					}}
					transition={{
						type: "spring",
						duration: 0.5,
						ease: "easeInOut",
						bounce: 0.25
					}}
					className="absolute inset-0 rounded-full bg-black-90 bg-brand-gradient shadow-brand-1 transition-colors"
					layoutId="switch-indicator"
				/>
			)}
			<Icon className={twMerge("z-10 aspect-square h-6 desktop:h-8", iconClassName, active && "fill-white-10")} />
			{(rankedMode && (props.id === "date-mode-switch" || props.id === "homie-mode-switch") && (
				<span className={twMerge(
					"z-10 pr-2",
					active ? "text-white-20" : "hidden text-black-70 group-hocus:text-white-20 dark:text-white-20 desktop:block"
				)}
				>
					{t(props.id === "date-mode-switch" ? "ranked" : "casual")}
				</span>
			))}
		</Link>
	);
};

export const NavigationItem: FC<
	ComponentProps<typeof Link>
> = ({ children, href, ...props }) => {
	const active = useMatch({ path: href as string });

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
			href={href}
		>
			{children}
		</Link>
	);
};
