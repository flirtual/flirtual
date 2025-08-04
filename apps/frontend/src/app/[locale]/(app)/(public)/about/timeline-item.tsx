import type { ResourceKeys } from "i18next";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import Image2023 from "virtual:remote/36446ecb-9103-4b6d-b221-7c657f17323d";
import Image2021 from "virtual:remote/366e91ce-2e3d-4e00-88e3-42626ec6e42f";
import Image2022 from "virtual:remote/726f31b1-fb07-4dc8-af9f-f10985aee7be";
import Image2018 from "virtual:remote/88bb9381-87ed-499d-9667-cd61eff96938";
import Image2019 from "virtual:remote/c373b72d-16a0-479c-b834-ccb7041bc615";
import Image2024 from "virtual:remote/ce26852c-d7a2-439c-95aa-55543b1c7d23";
import Image2020 from "virtual:remote/ead58fb3-e858-4e13-8acc-c9a5266a5b86";

import { Image } from "~/components/image";
import type { DefaultNamespace } from "~/i18n";

const images = {
	2018: Image2018,
	2019: Image2019,
	2020: Image2020,
	2021: Image2021,
	2022: Image2022,
	2023: Image2023,
	2024: Image2024
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
