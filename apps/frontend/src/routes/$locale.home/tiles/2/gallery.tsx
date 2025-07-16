/* eslint-disable @next/next/no-img-element */
import { type FC, useCallback, useState } from "react";

import { useInterval } from "~/hooks/use-interval";
import { useMessages } from "~/i18n";
import { urls } from "~/urls";

export const CarouselGallery: FC = () => {
	const { bounce_knot_legs_bell: _images } = useMessages();

	/*
	t("bounce_knot_legs_bell.0.title")"
	t("bounce_knot_legs_bell.1.title")"
	t("bounce_knot_legs_bell.2.title")"
	t("bounce_knot_legs_bell.3.title")"
	t("bounce_knot_legs_bell.4.title")"
	t("bounce_knot_legs_bell.5.title")"
	t("bounce_knot_legs_bell.6.title")"
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
