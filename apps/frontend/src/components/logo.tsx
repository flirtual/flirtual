import { useCallback } from "react";
import type { ComponentProps, FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { Theme } from "~/hooks/use-theme";
import { useNavigate } from "~/i18n";
import { urls } from "~/urls";

export const FlirtualLogo: FC<{ theme?: Theme } & Omit<ComponentProps<"img">, "src">> = ({ className, theme, ...props }) => {
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
				src={urls.media({
					dark: "flirtual-white.svg",
					light: "flirtual-black.svg"
				}[theme])}
				className={className}
			/>
		);

	return (
		<>
			<img
				{...elementProps}
				className={twMerge("dark:hidden", className)}
				src={urls.media("flirtual-black.svg")}
			/>
			<img
				{...elementProps}
				className={twMerge("hidden dark:block", className)}
				src={urls.media("flirtual-white.svg")}
			/>
		</>
	);
};
