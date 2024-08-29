"use client";

import { useCallback, useState } from "react";
import { useInView } from "react-intersection-observer";

import { useInterval } from "~/hooks/use-interval";
import { urls } from "~/urls";

import { SnapSection } from "../snap-section";

import type { TileProps } from "../page";

const values = [
	"VR is a personality-first way of meeting new people.",
	"Avatars help you express yourself, without feeling self-conscious.",
	"After a VR date or two, go on a video call or meet in real life!"
];

export const AvatarProfiles: React.FC<TileProps> = ({ id, onVisible }) => {
	const [ref] = useInView({ onChange: (inView) => inView && onVisible() });
	const [activeIndex, setActiveIndex] = useState(0);

	useInterval(
		useCallback(() => {
			setActiveIndex((activeIndex) => (activeIndex + 1) % values.length);
		}, [values.length]),
		5000
	);

	const activeValue = values[activeIndex];

	return (
		<SnapSection
			className="px-8 pb-32 pt-20 desktop:px-20 desktop:pt-32"
			data-tile={id}
		>
			<div className="max-w-screen-2xl mx-auto flex size-full flex-col items-center justify-center gap-8">
				<img
					className="scale-125 wide:h-[50vh] wide:scale-100"
					src={urls.media("303e4ab2-b72f-4947-829e-e818514be4d9")}
				/>
				<div className="flex h-fit flex-col gap-8 text-center">
					<h1
						ref={ref}
						className="text-balance font-montserrat text-5xl font-extrabold desktop:text-7xl"
					>
						Your avatar, your choice
					</h1>
					<span className="h-[8ch] max-w-4xl text-balance font-nunito  text-2xl font-normal leading-snug desktop:h-[5ch] desktop:text-5xl">
						{activeValue}
					</span>
				</div>
			</div>
		</SnapSection>
	);
};
