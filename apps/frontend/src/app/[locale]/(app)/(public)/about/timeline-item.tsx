import type { ResourceKeys } from "i18next";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Image } from "~/components/image";
import type { DefaultNamespace } from "~/i18n";
import Image2018 from "~/static/about/timeline/2018.png";
import Image2019 from "~/static/about/timeline/2019.png";
import Image2020 from "~/static/about/timeline/2020.png";
import Image2021 from "~/static/about/timeline/2021.png";
import Image2022 from "~/static/about/timeline/2022.png";
import Image2023 from "~/static/about/timeline/2023.png";
import Image2024 from "~/static/about/timeline/2024.png";
import Image2025 from "~/static/about/timeline/2025.png";

const images = {
	2018: Image2018,
	2019: Image2019,
	2020: Image2020,
	2021: Image2021,
	2022: Image2022,
	2023: Image2023,
	2024: Image2024,
	2025: Image2025
};

export type TimelineItemYear = {
	[K in ResourceKeys<true>[DefaultNamespace]]: K extends `outgoing_teeny_tiny_pass_male.${infer T extends number}` ? T : never;
}[ResourceKeys<true>[DefaultNamespace]];

export const TimelineItem: FC<{ year: TimelineItemYear; index: number }> = ({
	year,
	index
}) => {
	const { t } = useTranslation();
	const { image_alt, description, title } = t(`outgoing_teeny_tiny_pass_male.${year}`, { returnObjects: true });

	return (
		<div className="grid grid-cols-2 items-center gap-6">
			<Image
				alt={image_alt}
				className={twMerge("rounded-md shadow-brand-1")}
				height={461}
				src={images[year]}
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
