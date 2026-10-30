import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { Image } from "~/components/image";
import { press } from "~/features";
import { useUserCount } from "~/hooks/use-user";
import { useMessages } from "~/i18n";
import AnimePair from "~/static/home/members/anime-pair.jpg";
import CabinCuddle from "~/static/home/members/cabin-cuddle.jpg";
import CheekToCheek from "~/static/home/members/cheek-to-cheek.jpg";
import ClubDance from "~/static/home/members/club-dance.jpg";
import ClubFriends from "~/static/home/members/club-friends.jpg";
import CouchTrio from "~/static/home/members/couch-trio.jpg";
import FlowerField from "~/static/home/members/flower-field.jpg";
import FurryStack from "~/static/home/members/furry-stack.jpg";
import LapSit from "~/static/home/members/lap-sit.jpg";
import NightHug from "~/static/home/members/night-hug.jpg";
import SkyPeaceSigns from "~/static/home/members/sky-peace-signs.jpg";
import SnowySelfie from "~/static/home/members/snowy-selfie.jpg";
import ThanosSelfie from "~/static/home/members/thanos-selfie.jpg";
import WavingPair from "~/static/home/members/waving-pair.jpg";
import BrandDazed from "~/static/press/dazed.png";
import BrandForbes from "~/static/press/forbes.png";
import BrandFutureOfSex from "~/static/press/future-of-sex.png";
import BrandiDateAwards from "~/static/press/idate-awards.png";
import BrandNewYorkTimes from "~/static/press/new-york-times.png";
import BrandRoadToVR from "~/static/press/road-to-vr.png";
import BrandSamsung from "~/static/press/samsung.png";
import BrandTheNewYorker from "~/static/press/the-new-yorker.png";
import BrandToday from "~/static/press/today.png";
import BrandVirtualWeekality from "~/static/press/virtual-weekality.png";

import { Tile, TileAnchor } from ".";
import type { TileProps } from ".";

const images = [
	CheekToCheek,
	CabinCuddle,
	ClubDance,
	ClubFriends,
	NightHug,
	WavingPair,
	AnimePair,
	FlowerField,
	ThanosSelfie,
	CouchTrio,
	SkyPeaceSigns,
	LapSit,
	SnowySelfie,
	FurryStack
];

const brandImages = [
	BrandNewYorkTimes,
	BrandToday,
	BrandForbes,
	BrandTheNewYorker,
	BrandRoadToVR,
	BrandSamsung,
	BrandFutureOfSex,
	BrandDazed,
	BrandVirtualWeekality,
	BrandiDateAwards
];

const Header = withSuspense(() => {
	const { t } = useTranslation();
	const userCount = useUserCount();
	return t("landing_user_count_heading", { userCount });
}, {
	fallback: () => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const { t } = useTranslation();
		return t("landing_user_count_heading", { userCount: 100000 }); ;
	}
});

export function Testimonial({ id }: TileProps) {
	const {
		landing_press_outlets: brandNames
	} = useMessages();

	return (
		<Tile id={id} className="flex flex-col overflow-hidden">
			<div className="flex justify-center p-8 desktop:p-16 desktop:py-12">
				<TileAnchor id={id}>
					<span className="font-montserrat text-3xl font-extrabold desktop:text-4xl">
						<Header />
					</span>
				</TileAnchor>
			</div>
			<div className="flex h-[40vh] shrink-0 overflow-x-hidden desktop:tall:h-[50vh]">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:tall:h-[50vh]">
						{images.map((source) => (
							<img
								// fetchPriority={index === 0 ? "high" : "low"}
								key={source}
								className="h-full object-cover"
								src={source}
							/>
						))}
					</div>
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:tall:h-[50vh]">
						{images.map((source) => (
							<img
								// fetchPriority={index === 0 ? "high" : "low"}
								key={source}
								className="h-full object-cover"
								src={source}
							/>
						))}
					</div>
				</div>
			</div>
			{press && (
				<div className="relative mx-auto flex max-h-full max-w-screen-wide flex-wrap items-center justify-around gap-8 p-8 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black-80 desktop:h-full desktop:max-w-none desktop:px-16 desktop:py-8 desktop:tall:max-w-screen-wide desktop:tall:before:bg-none">
					{Object.values(brandNames).map((name, index) => (
						<Image
							key={name}
							alt={name}
							className="h-auto w-20 desktop:tall:w-32"
							height={128}
							src={brandImages[index]}
							style={{ transitionDuration: `${index * 10}ms` }}
							width={128}
						/>
					))}
				</div>
			)}
		</Tile>
	);
}
