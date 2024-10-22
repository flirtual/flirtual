import { useTranslations } from "next-intl";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";

import type { FC } from "react";
import type { MessageKeys } from "~/i18n/request";

export type TimelineItemYear = {
	[K in MessageKeys]: K extends `about.timeline.${infer T}` ? T : never;
}[MessageKeys];

export const TimelineItem: FC<{ year: TimelineItemYear; index: number }> = ({
	year,
	index
}) => {
	const t = useTranslations(`about.timeline.${year}`);

	return (
		<div className="grid grid-cols-2 items-center gap-6">
			<Image
				alt={t("image_alt")}
				className={twMerge("rounded-md shadow-brand-1")}
				height={461}
				src={urls.media(t("image"))}
				width={810}
			/>
			<div
				className={twMerge(
					"flex flex-col px-4",
					index % 2 !== 0 ? "-order-1 text-right" : ""
				)}
			>
				<span className="font-montserrat text-2xl font-bold">{t("title")}</span>
				<span>{t("description")}</span>
			</div>
		</div>
	);
};
