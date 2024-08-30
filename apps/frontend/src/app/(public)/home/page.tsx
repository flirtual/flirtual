import { Carousel } from "./tiles/2";
import { AvatarProfiles } from "./tiles/1";
import { Testimonial } from "./tiles/3";
import { Hero } from "./tiles/0";
import { CallToAction } from "./tiles/4";
import { TileGuide, TileProvider } from "./tiles";

const tiles = [Hero, AvatarProfiles, Carousel, Testimonial, CallToAction];

export default async function RootIndexPage() {
	return (
		<TileProvider>
			<div className="flex h-screen snap-x snap-mandatory overflow-y-hidden scroll-smooth bg-black-80 text-white-20 desktop:snap-y desktop:flex-col desktop:overflow-x-hidden desktop:overflow-y-scroll">
				{tiles.map((Tile, index) => (
					<Tile key={index} id={index} />
				))}
				<TileGuide tileCount={tiles.length} />
			</div>
		</TileProvider>
	);
}
