import ms from "ms" with { type: "macro" };
import { useCallback, useState } from "react";
import type { FC } from "react";

import { useInterval } from "~/hooks/use-interval";
import { useMessages } from "~/i18n";
import BlackHole from "~/static/home/date-ideas/black-hole.jpg";
import CozyCafe from "~/static/home/date-ideas/cozy-cafe.jpg";
import FeedDucks from "~/static/home/date-ideas/feed-ducks.jpg";
import PaintTogether from "~/static/home/date-ideas/paint-together.jpg";
import PlayPool from "~/static/home/date-ideas/play-pool.jpg";
import SwimWithSharks from "~/static/home/date-ideas/swim-with-sharks.jpg";
import TouchGrass from "~/static/home/date-ideas/touch-grass.jpg";

const images = [FeedDucks, SwimWithSharks, CozyCafe, BlackHole, TouchGrass, PaintTogether, PlayPool];

export const CarouselGallery: FC = () => {
	const { landing_date_ideas: _tabs } = useMessages();

	/*
	t("landing_date_ideas.0")"
	t("landing_date_ideas.1")"
	t("landing_date_ideas.2")"
	t("landing_date_ideas.3")"
	t("landing_date_ideas.4")"
	t("landing_date_ideas.5")"
	t("landing_date_ideas.6")"
	*/

	const tabs = Object.values(_tabs);
	const [activeIndex, setActiveIndex] = useState(0);

	const next = useCallback(() => {
		setActiveIndex((activeIndex) => (activeIndex + 1) % tabs.length);
	}, [tabs.length]);

	const { reset } = useInterval(
		useCallback(() => next(), [next]),
		ms("5s")
	);

	return (
		<div className="flex">
			{tabs.map((title, index) => (
				<button
					key={title}
					className="pointer-events-none absolute flex h-screen w-screen shrink-0 snap-center snap-always opacity-0 transition-opacity duration-500 data-active:pointer-events-auto data-active:opacity-100"
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
