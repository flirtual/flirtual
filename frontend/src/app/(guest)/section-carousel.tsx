"use client";

import { useCallback, useState } from "react";

import { UCImage } from "~/components/uc-image";
import { useInterval } from "~/hooks/use-interval";

import { SnapSection } from "./snap-section";

export interface SectionCarouselProps {
	values: Array<[src: string, label: string]>;
}

export const SectionCarousel: React.FC<SectionCarouselProps> = ({ values }) => {
	const [activeIdx, setActiveIdx] = useState(0);

	const next = useCallback(() => {
		setActiveIdx((activeIdx) => (activeIdx + 1) % values.length);
	}, [values.length]);

	const { reset } = useInterval(
		useCallback(() => next(), [next]),
		5000
	);

	return (
		<SnapSection className="relative" id="carousel">
			<div className="absolute z-10 flex w-full justify-center px-8 py-16 md:px-16">
				<span className="text-center font-montserrat text-2xl font-semibold [text-shadow:0_0_16px_#000] md:text-4xl">
					Safe, magical dates <br />
					with people all over the world
				</span>
			</div>
			<div className="flex">
				{values.map(([src, label], idx) => (
					<button
						className="absolute flex h-screen w-screen shrink-0 snap-center snap-always transition-opacity duration-500"
						key={src}
						type="button"
						style={{
							opacity: activeIdx === idx ? 1 : 0,
							pointerEvents: activeIdx === idx ? "all" : "none"
						}}
						onClick={() => {
							reset();
							next();
						}}
					>
						<div className="absolute z-10 flex h-full w-full select-none items-center justify-center p-16">
							<span className="font-nunito text-5xl font-bold [text-shadow:0_0_16px_#000] md:text-7xl">
								{label}
							</span>
						</div>
						<UCImage className="h-full w-full shrink-0 object-cover brightness-75" src={src} />
					</button>
				))}
			</div>
		</SnapSection>
	);
};
