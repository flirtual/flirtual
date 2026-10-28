import { useCallback } from "react";
import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { Theme } from "~/hooks/use-theme";
import { useNavigate } from "~/i18n";
import LogoOnDark from "~/static/logo-on-dark.svg";
import LogoOnLight from "~/static/logo-on-light.svg";
import { urls } from "~/urls";

export const Logo: FC<{ theme?: Theme } & Omit<ComponentProps<"img">, "src">> = ({ className, theme, ...props }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const elementProps = {
		alt: t("flirtual_logo"),
		onContextMenu: useCallback((event: React.MouseEvent<HTMLImageElement>) => {
			event.preventDefault();
			navigate(urls.resources.branding);
		}, [navigate]),
		...props
	};

	if (theme)
		return (
			<img
				{...elementProps}
				src={{
					dark: LogoOnDark,
					light: LogoOnLight
				}[theme]}
				className={className}
			/>
		);

	return (
		<>
			<img
				{...elementProps}
				className={twMerge("dark:hidden", className)}
				src={LogoOnLight}
			/>
			<img
				{...elementProps}
				className={twMerge("hidden dark:block", className)}
				src={LogoOnDark}
			/>
		</>
	);
};
