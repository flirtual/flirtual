/* eslint-disable @next/next/no-img-element */
"use client";

import { useMessages } from "next-intl";
import { type FC, useCallback, useState } from "react";

import { useInterval } from "~/hooks/use-interval";
import { urls } from "~/urls";

export const CarouselGallery: FC = () => {
	const {
		landing: {
			carousel: { images: _images }
		}
	} = useMessages() as unknown as {
		landing: {
			carousel: {
				images: Record<
					number,
					{
						title: string;
						image: string;
					}
				>;
			};
		};
	};

	/*
	t("landing.carousel.images.0.title")"
	t("landing.carousel.images.1.title")"
	t("landing.carousel.images.2.title")"
	t("landing.carousel.images.3.title")"
	t("landing.carousel.images.4.title")"
	t("landing.carousel.images.5.title")"
	t("landing.carousel.images.6.title")"
	*/

	const images = Object.values(_images);
	const [activeIndex, setActiveIndex] = useState(0);

	const next = useCallback(() => {
		setActiveIndex((activeIndex) => (activeIndex + 1) % images.length);
	}, [images.length]);

	const { reset } = useInterval(
		useCallback(() => next(), [next]),
		5000
	);

	return (
		<div className="flex">
			{images.map(({ title, image }, index) => (
				<button
					className="pointer-events-none absolute flex h-screen w-screen shrink-0 snap-center snap-always opacity-0 transition-opacity duration-500 data-[active]:pointer-events-auto data-[active]:opacity-100"
					data-active={activeIndex === index ? "" : undefined}
					key={image}
					type="button"
					onClick={() => {
						reset();
						next();
					}}
				>
					<div className="absolute z-10 flex size-full items-center justify-center px-8 py-16 desktop:px-28">
						<span className="font-nunito text-5xl font-bold [text-shadow:0_0_16px_#000] desktop:text-7xl">
							{title}
						</span>
					</div>
					<img
						className="size-full shrink-0 object-cover brightness-75"
						src={urls.media(image)}
					/>
				</button>
			))}
		</div>
	);
};
