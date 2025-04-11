import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { TileGuide, TileProvider } from "./tiles";
import { Hero } from "./tiles/0";
import { AvatarProfiles } from "./tiles/1";
import { Carousel } from "./tiles/2";
import { Testimonial } from "./tiles/3";
import { CallToAction } from "./tiles/4";

// export const dynamic = "force-static";

const tiles = [Hero, AvatarProfiles, Carousel, Testimonial, CallToAction];

export default function RootIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return (
		<TileProvider>
			<div className="flex h-screen snap-x snap-mandatory overflow-y-hidden scroll-smooth bg-black-80 text-white-20 desktop:snap-y desktop:flex-col desktop:overflow-x-hidden desktop:overflow-y-scroll">
				{tiles.map((Tile, index) => (
					// eslint-disable-next-line react/no-array-index-key
					<Tile id={index} key={index} />
				))}
				<TileGuide tileCount={tiles.length} />
			</div>
		</TileProvider>
	);
}
