import { queryClient, userCountFetcher, userCountKey } from "~/query";

import { TileGuide, TileProvider } from "./tiles";
import { Hero } from "./tiles/0";
import { AvatarProfiles } from "./tiles/1";
import { Carousel } from "./tiles/2";
import { Testimonial } from "./tiles/3";
import { TheEnd } from "./tiles/4";

const tiles = [
	Hero,
	AvatarProfiles,
	Carousel,
	Testimonial,
	TheEnd
];

export const handle = {
	async preload() {
		await queryClient.prefetchQuery({
			queryKey: userCountKey(),
			queryFn: userCountFetcher
		});
	}
};

export default function LandingPage() {
	return (
		<TileProvider>
			<div className="flex h-screen snap-x snap-mandatory overflow-y-hidden scroll-smooth bg-black-80 text-white-20 desktop:snap-y desktop:flex-col desktop:overflow-x-hidden desktop:overflow-y-scroll">
				{/* eslint-disable-next-line react/no-array-index-key */}
				{tiles.map((Tile, index) => <Tile id={index} key={index} />)}
				<TileGuide tileCount={tiles.length} />
			</div>
		</TileProvider>
	);
}
