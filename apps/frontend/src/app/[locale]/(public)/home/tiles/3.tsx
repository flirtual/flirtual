import { useTranslation } from "react-i18next";
import BrandTheNewYorker from "virtual:remote/18e4a7ad-625a-42f6-b581-d14386ced012";
import BrandForbes from "virtual:remote/257a7f46-a6c1-4bee-9a3e-5dbdfe9d2a66";
import BrandRoadToVR from "virtual:remote/29a2f1bc-0b3e-469a-aa11-0de69b75b629";
import Image2f008d68 from "virtual:remote/2f008d68-81d6-4d16-b467-d248858659fc";
import Image363c885e from "virtual:remote/363c885e-8a7d-4f26-af41-d2356144ccf4";
import Image406321aa from "virtual:remote/406321aa-d3f9-4218-895d-a6b407be3658";
import Image535227ef from "virtual:remote/535227ef-443c-4fef-a1c2-a25daaa568d0";
import BrandFutureOfSex from "virtual:remote/54ffe640-1c54-4d8f-a754-4c7b7ca82456";
import Image65dcb388 from "virtual:remote/65dcb388-7d26-4f9c-a8af-e6a11ec37c86";
import BrandVirtualWeekality from "virtual:remote/7845a7d0-0461-41dd-934c-cb8439e90dc7";
import Image7edf15b5 from "virtual:remote/7edf15b5-f913-4923-9180-06e3824ffd3d";
import ImageAb689e7b from "virtual:remote/ab689e7b-6211-419a-9cdd-abf5de43a72f";
import ImageAd9255b2 from "virtual:remote/ad9255b2-d4c8-4f42-9c96-23584c4456d4";
import ImageB2dae95f from "virtual:remote/b2dae95f-ec0f-4143-ba1c-14aa4c4dc0ef";
import BrandDazed from "virtual:remote/b779aa38-8592-48cd-8f9b-88228c5abc21";
import ImageBdd0738b from "virtual:remote/bdd0738b-d2b6-498c-b889-61cc3e8707f1";
import ImageC5075e9a from "virtual:remote/c5075e9a-79b1-46a9-a587-90cade6c6182";
import ImageCc9dfd99 from "virtual:remote/cc9dfd99-ed08-41e7-b4df-22bcda1477ed";
import BrandToday from "virtual:remote/d34ee25e-31e6-47a7-952f-51820f1e1ce1";
import BrandSamsung from "virtual:remote/db2eb424-e837-4d64-85e0-e49409ae33a6";
import BrandNewYorkTimes from "virtual:remote/dc248f6f-aee6-4318-b473-6fe2d6db07ee";
import ImageE812eb97 from "virtual:remote/e812eb97-03ba-4309-a2e1-42cddadc4497";
import ImageFa83b674 from "virtual:remote/fa83b674-ccc4-4dce-9573-917fc0a0c090";
import BrandiDateAwards from "virtual:remote/fd92ab0f-d264-4a69-813f-bea13def2c46";
import { withSuspense } from "with-suspense";

import { Image } from "~/components/image";
import { useUserCount } from "~/hooks/use-user";
import { useMessages } from "~/i18n";

import { Tile, TileAnchor } from ".";
import type { TileProps } from ".";

const images = [
	Image406321aa,
	Image65dcb388,
	Image7edf15b5,
	Image363c885e,
	ImageE812eb97,
	ImageCc9dfd99,
	ImageFa83b674,
	Image2f008d68,
	ImageBdd0738b,
	ImageAd9255b2,
	ImageAb689e7b,
	ImageB2dae95f,
	Image535227ef,
	ImageC5075e9a
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
	return t("even_major_hare_believe", { userCount });
}, {
	fallback: () => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const { t } = useTranslation();
		return t("even_major_hare_believe", { userCount: 100000 }); ;
	}
});

export function Testimonial({ id }: TileProps) {
	const {
		acidic_advertisement_request_cough: brandNames
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
		</Tile>
	);
}
