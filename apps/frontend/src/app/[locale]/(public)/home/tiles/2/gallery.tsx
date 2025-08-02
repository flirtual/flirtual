import { useCallback, useState } from "react";
import type { FC } from "react";
import Image1049fc02 from "virtual:remote/1049fc02-6e6b-4178-b762-b46e56f9fa66";
import Image1e084a7b from "virtual:remote/1e084a7b-d532-4f82-8bf1-4a51cec55e9e";
import Image40d6b065 from "virtual:remote/40d6b065-7249-463c-8c31-f74ad922a0e6";
import Image4677372a from "virtual:remote/4677372a-c0b9-4ad6-870b-aff66ec4ca9d";
import Image99f9bdc0 from "virtual:remote/99f9bdc0-b55a-462d-9614-d895d14b690e";
import ImageA137add7 from "virtual:remote/a137add7-ecc1-425a-9313-e6862d43e00c";
import ImageD9a2206c from "virtual:remote/d9a2206c-7624-4551-bc78-3a9fc15eef74";

import { useInterval } from "~/hooks/use-interval";
import { useMessages } from "~/i18n";

const images = [Image1e084a7b, ImageA137add7, Image40d6b065, ImageD9a2206c, Image1049fc02, Image99f9bdc0, Image4677372a];

export const CarouselGallery: FC = () => {
	const { bounce_knot_legs_bell: _tabs } = useMessages();

	/*
	t("bounce_knot_legs_bell.0")"
	t("bounce_knot_legs_bell.1")"
	t("bounce_knot_legs_bell.2")"
	t("bounce_knot_legs_bell.3")"
	t("bounce_knot_legs_bell.4")"
	t("bounce_knot_legs_bell.5")"
	t("bounce_knot_legs_bell.6")"
	*/

	const tabs = Object.values(_tabs);
	const [activeIndex, setActiveIndex] = useState(0);

	const next = useCallback(() => {
		setActiveIndex((activeIndex) => (activeIndex + 1) % tabs.length);
	}, [tabs.length]);

	const { reset } = useInterval(
		useCallback(() => next(), [next]),
		5000
	);

	return (
		<div className="flex">
			{tabs.map((title, index) => (
				<button
					key={title}
					className="pointer-events-none absolute flex h-screen w-screen shrink-0 snap-center snap-always opacity-0 transition-opacity duration-500 data-[active]:pointer-events-auto data-[active]:opacity-100"
					data-active={activeIndex === index ? "" : undefined}
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
						src={images[index]}
					/>
				</button>
			))}
		</div>
	);
};
