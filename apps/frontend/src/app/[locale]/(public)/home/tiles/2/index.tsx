import { useTranslation } from "react-i18next";

import { Tile, TileAnchor } from "..";
import type { TileProps } from "..";
import { CarouselGallery } from "./gallery";

export function Carousel({ id }: TileProps) {
	const { t } = useTranslation();

	return (
		<Tile id={id} className="relative">
			<div className="absolute z-10 flex w-full justify-center pb-32 pl-[calc(2rem+var(--safe-area-inset-left,0rem))] pr-[calc(2rem+var(--safe-area-inset-right,0rem))] pt-20 desktop:px-24">
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
