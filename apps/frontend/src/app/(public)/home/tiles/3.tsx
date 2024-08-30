import Image from "next/image";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import ms from "ms";

import { urls } from "~/urls";
import { api } from "~/api";

import { Tile, TileAnchor, type TileProps } from ".";

const getApproximateUserCount = unstable_cache(
	() => api.user.count().then((count) => Math.floor(count / 5000) * 5000),
	["userCount"],
	{ revalidate: ms("1d") / 1000 }
);

export async function Testimonial({ id }: TileProps) {
	const [userCount, messages, t, format] = await Promise.all([
		getApproximateUserCount(),
		getMessages(),
		getTranslations("landing.testimonial"),
		getFormatter()
	]);

	const {
		landing: {
			testimonial: { images, brands }
		}
	} = messages as unknown as {
		landing: {
			testimonial: {
				images: Array<string>;
				brands: Array<{
					name: string;
					image: string;
				}>;
			};
		};
	};

	return (
		<Tile className="flex flex-col" id={id}>
			<div className="flex justify-center p-8 desktop:p-16">
				<TileAnchor id={id}>
					<span className="font-montserrat text-3xl font-extrabold desktop:text-5xl">
						{t("even_major_hare_believe", {
							userCount: format.number(userCount)
						})}
					</span>
				</TileAnchor>
			</div>
			<div className="flex h-[40vh] shrink-0 overflow-x-hidden desktop:h-[50vh]">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:h-[50vh]">
						{images.map((source, index) => (
							<img
								fetchPriority={index === 0 ? "high" : "low"}
								className="h-full object-cover"
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:h-[50vh]">
						{images.map((source, index) => (
							<img
								fetchPriority={index === 0 ? "high" : "low"}
								className="h-full object-cover"
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
				</div>
			</div>
			<div className="relative mx-auto flex max-h-full max-w-screen-wide flex-wrap items-center justify-around gap-8 p-8 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black-80 desktop:h-full desktop:p-16 desktop:before:bg-none">
				{brands.map(({ name, image }, index) => (
					<Image
						key={image}
						alt={name}
						width={128}
						height={128}
						className="h-fit w-20 desktop:w-32"
						style={{ transitionDuration: `${index * 10}ms` }}
						src={urls.media(image)}
					/>
				))}
			</div>
		</Tile>
	);
}
