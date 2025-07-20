import type { ComponentProps, FC, MouseEventHandler } from "react";
import { useNavigate } from "react-router";
import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";

export const FlirtualLogo: FC<Omit<ComponentProps<"img">, "src">> = ({ className, ...props }) => {
	const navigate = useNavigate();

	const handleSecondaryClick: MouseEventHandler<HTMLImageElement> = (event) => {
		event.preventDefault();
		navigate(urls.resources.branding);
	};

	return (
		<img
			alt="Flirtual Logo"
			className={twMerge("text-[snow]", className)}
			src={urls.media("flirtual-white.svg")}
			onContextMenu={handleSecondaryClick}
			{...props}
		/>
	);
};
