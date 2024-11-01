import { useTranslations } from "next-intl";

import { Tile, TileAnchor, type TileProps } from "..";
import { CarouselGallery } from "./gallery";

export function Carousel({ id }: TileProps) {
	const t = useTranslations("landing.carousel");

	return (
		<Tile className="relative" id={id}>
			<div className="absolute z-10 flex w-full justify-center px-8 pb-32 pt-20 desktop:px-24">
				<TileAnchor id={id}>
					<span className="text-center font-montserrat text-2xl font-semibold [text-shadow:0_0_16px_#000] desktop:text-4xl">
						{t("spare_chunky_cougar_honor")}
					</span>
				</TileAnchor>
			</div>
			<CarouselGallery />
		</Tile>
	);
}
