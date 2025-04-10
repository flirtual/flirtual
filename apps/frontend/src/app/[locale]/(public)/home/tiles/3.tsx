import { getFormatter, getMessages, getTranslations } from "next-intl/server";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

import { User } from "~/api/user";
import { urls } from "~/urls";

import { Tile, TileAnchor, type TileProps } from ".";

export async function Testimonial({ id }: TileProps) {
	const [userCount, messages, t] = await Promise.all([
		1000, // User.getApproximateCount(),
		getMessages(),
		getTranslations(),
		getFormatter()
	]);

	const {
		flaky_thunder_red_flap: _images,
		acidic_advertisement_request_cough: brands
	} = messages as unknown as IntlMessages;

	const images = Object.values(_images);

	return (
		<Tile className="flex flex-col overflow-hidden" id={id}>
			<div className="flex justify-center p-8 desktop:p-16 desktop:py-12">
				<TileAnchor id={id}>
					<span className="font-montserrat text-3xl font-extrabold desktop:text-4xl">
						{t("even_major_hare_believe", {
							userCount
						})}
					</span>
				</TileAnchor>
			</div>
			<div className="flex h-[40vh] shrink-0 overflow-x-hidden desktop:tall:h-[50vh]">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:tall:h-[50vh]">
						{images.map((source, index) => (
							<img
								className="h-full object-cover"
								fetchPriority={index === 0 ? "high" : "low"}
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:tall:h-[50vh]">
						{images.map((source, index) => (
							<img
								className="h-full object-cover"
								fetchPriority={index === 0 ? "high" : "low"}
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
				</div>
			</div>
			<div className="relative mx-auto flex max-h-full max-w-screen-wide flex-wrap items-center justify-around gap-8 p-8 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black-80 desktop:h-full desktop:max-w-none desktop:px-16 desktop:py-8 desktop:tall:max-w-screen-wide desktop:tall:before:bg-none">
				{Object.values(brands).map(({ name, image }, index) => (
					<Image
						alt={name}
						className="h-auto w-20 desktop:tall:w-32"
						height={128}
						key={image}
						src={urls.media(image)}
						style={{ transitionDuration: `${index * 10}ms` }}
						width={128}
					/>
				))}
			</div>
		</Tile>
	);
}
