"use client";

import { useInView } from "react-intersection-observer";

import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";
import { ButtonLink } from "~/components/button";

import { SnapSection } from "../../snap-section";

import { BackgroundVideo } from "./background-video";

import type { TileProps } from "../../page";

export const Hero: React.FC<TileProps> = ({ id, onVisible }) => {
	const [ref] = useInView({ onChange: (inView) => inView && onVisible() });

	return (
		<SnapSection
			className="relative flex flex-col items-center justify-center font-montserrat"
			data-tile={id}
		>
			<div className="z-10 flex flex-col items-center px-8 pb-12 desktop:px-16">
				<FlirtualLogo className="mb-4 w-56" />
				<h1
					ref={ref}
					className="max-w-screen-desktop text-balance text-center text-6xl font-bold text-white-10 desktop:text-8xl"
				>
					The first VR dating app
				</h1>
				<div className="mt-16 hidden grid-cols-2 flex-col gap-2 desktop:grid">
					<ButtonLink href={urls.register} kind="primary">
						Sign up
					</ButtonLink>
					<ButtonLink href={urls.login()} kind="secondary">
						Log in
					</ButtonLink>
				</div>
			</div>
			<BackgroundVideo />
			{/* <button
				className="absolute bottom-0 z-10 mb-16"
				type="button"
				onClick={() => {
					document.querySelector("#avatar-profiles")?.scrollIntoView();
				}}
			>
				<ChevronDown className="size-12 animate-bounce" />
			</button> */}
		</SnapSection>
	);
};
