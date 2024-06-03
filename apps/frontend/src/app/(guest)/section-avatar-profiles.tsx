/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useState } from "react";

import { useInterval } from "~/hooks/use-interval";
import { urls } from "~/urls";

import { SnapSection } from "./snap-section";

export const SectionAvatarProfiles: React.FC<{ values: Array<string> }> = ({
	values
}) => {
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
			className="bg-brand-gradient px-8 py-16 md:px-16"
			id="avatar-profiles"
		>
			<div className="mx-auto flex size-full max-w-screen-2xl flex-col items-center justify-center gap-8">
				<div className="flex flex-col items-center justify-center gap-8 text-center">
					<h1 className="mt-8 font-montserrat text-5xl font-extrabold md:text-7xl">
						Your avatar, your choice
					</h1>
					<span className="h-[8ch] max-w-4xl font-nunito text-2xl font-normal leading-snug sm:text-3xl md:h-[5ch] md:text-5xl">
						{activeValue}
					</span>
				</div>
				<img
					className="scale-125 lg:h-[60vh] lg:scale-100"
					src={urls.media("303e4ab2-b72f-4947-829e-e818514be4d9")}
				/>
			</div>
		</SnapSection>
	);
};
