import React from "react";
import Link, { type LinkProps } from "next/link";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import type { IconComponent } from "./icons";

export type MobileButtonProps = LinkProps & {
	label: string;
	Icon: IconComponent;
	className?: string;
};

export const MobileButton: React.FC<MobileButtonProps> = ({
	Icon,
	label,
	className,
	...props
}) => {
	const t = useTranslations("download");

	return (
		<Link
			{...props}
			className={twMerge(
				"flex w-56 select-none items-center gap-4 rounded-xl bg-white-10 px-6 py-4 text-black-70 shadow-brand-1",
				className
			)}
			target="_blank"
		>
			<Icon className="h-8" />
			<div className="flex flex-col justify-center text-left">
				<span className="font-montserrat text-xs font-bold uppercase">
					{t("best_topical_mayfly_tap")}
				</span>
				<span className="font-nunito">{label}</span>
			</div>
		</Link>
	);
};
