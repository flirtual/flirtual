import type { ResourceKeys } from "i18next";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Image } from "~/components/image";
import type { DefaultNamespace } from "~/i18n";
import { urls } from "~/urls";

export type TimelineItemYear = {
	[K in ResourceKeys<true>[DefaultNamespace]]: K extends `outgoing_teeny_tiny_pass_male.${infer T extends number}` ? T : never;
}[ResourceKeys<true>[DefaultNamespace]];

export const TimelineItem: FC<{ year: TimelineItemYear; index: number }> = ({
	year,
	index
}) => {
	const { t } = useTranslation();
	const { image, image_alt, description, title } = t(`outgoing_teeny_tiny_pass_male.${year}`, { returnObjects: true });

	return (
		<div className="grid grid-cols-2 items-center gap-6">
			<Image
				alt={image_alt}
				className={twMerge("rounded-md shadow-brand-1")}
				height={461}
				src={urls.media(image)}
				width={810}
			/>
			<div
				className={twMerge(
					"flex flex-col px-4",
					index % 2 !== 0 ? "-order-1 text-right" : ""
				)}
			>
				<span className="font-montserrat text-2xl font-bold">{title}</span>
				<span>{description}</span>
			</div>
		</div>
	);
};
