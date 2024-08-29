"use client";

import { useCallback, useState } from "react";
import { useInView } from "react-intersection-observer";

import { useInterval } from "~/hooks/use-interval";
import { urls } from "~/urls";

import { SnapSection } from "../snap-section";

import type { TileProps } from "../page";

const values: Array<[src: string, label: string]> = [
	["b9326c15-c996-488f-8d68-d7ea4cb8649b", "Feed some ducks"],
	["738f3d22-6f38-4059-9dd3-7fdd672acccd", "Swim... with sharks"],
	["be840a83-86f9-4ba2-87ae-3cd93f73f099", "Chill in a cozy cafe"],
	["107737a5-d694-43db-a082-0d71bdfc4105", "Observe a black hole"],
	["30023b24-f08a-43d4-918a-aa8940cefb24", "Touch grass"],
	["09402677-a01e-4f6b-9171-f8c533ec774f", "Paint together"],
	["7e736467-63c4-4ff4-9989-54546b24cc6f", "Play some pool"]
];

export const Carousel: React.FC<TileProps> = ({ id, onVisible }) => {
	const [activeIndex, setActiveIndex] = useState(0);

	const next = useCallback(() => {
		setActiveIndex((activeIndex) => (activeIndex + 1) % values.length);
	}, [values.length]);

	const { reset } = useInterval(
		useCallback(() => next(), [next]),
		5000
	);

	const [ref] = useInView({ onChange: (inView) => inView && onVisible() });

	return (
		<SnapSection data-tile={id} className="relative">
			<div className="absolute z-10 flex w-full justify-center px-8 pb-32 pt-20 desktop:px-20">
				<span
					ref={ref}
					className="text-center font-montserrat text-2xl font-semibold [text-shadow:0_0_16px_#000] desktop:text-4xl"
				>
					Enjoy safe, magical dates together in Virtual Reality
				</span>
			</div>
			<div className="flex">
				{values.map(([source, label], index) => (
					<button
						className="pointer-events-none absolute flex h-screen w-screen shrink-0 snap-center snap-always opacity-0 transition-opacity duration-500 data-[active]:pointer-events-auto data-[active]:opacity-100"
						key={source}
						type="button"
						data-active={activeIndex === index ? "" : undefined}
						onClick={() => {
							reset();
							next();
						}}
					>
						<div className="absolute z-10 flex size-full select-none items-center justify-center p-16">
							<span className="font-nunito text-5xl font-bold [text-shadow:0_0_16px_#000] desktop:text-7xl">
								{label}
							</span>
						</div>
						<img
							className="size-full shrink-0 object-cover brightness-75"
							src={urls.media(source)}
						/>
					</button>
				))}
			</div>
		</SnapSection>
	);
};
