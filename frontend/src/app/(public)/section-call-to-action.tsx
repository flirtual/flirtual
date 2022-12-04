"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";

import { FlirtualLogo } from "~/components/logo";
import { UCImage } from "~/components/uc-image";
import { urls } from "~/pageUrls";

import { LandingButton } from "./landing-button";
import { SnapSection } from "./snap-section";

export const SectionCallToAction: React.FC = () => (
	<SnapSection
		className="relative flex flex-col items-center justify-center font-montserrat"
		id="call-to-action"
	>
		<div className="z-10 flex flex-col items-center px-8 py-16 md:px-16">
			<FlirtualLogo />
			<h1 className="text-3xl font-bold sm:text-4xl md:text-6xl">The VR Dating App</h1>
			<div className="mt-8 flex flex-col gap-4 gap-y-8 md:flex-row">
				<LandingButton href={urls.register()} kind="primary">
					Sign up
				</LandingButton>
				<LandingButton href={urls.login()} kind="secondary">
					Login
				</LandingButton>
			</div>
		</div>
		<video
			autoPlay
			disablePictureInPicture
			disableRemotePlayback
			loop
			muted
			playsInline
			className="absolute top-0 left-0 h-full w-full object-cover brightness-50"
			poster="https://media.flirtu.al/6be390d0-4479-4a98-8c7a-10257ea5585a/-/format/auto/-/quality/smart/-/resize/1920x/"
		>
			<source
				src="https://media.flirtu.al/300c30ee-6b22-48a7-8d40-dc0deaf673ed/video.webm"
				type="video/webm; codecs=vp9"
			/>
			<source
				src="https://media.flirtu.al/e67df8d2-295c-4bc0-9ebf-33f477267edd/video.mp4"
				type="video/mp4"
			/>
			<UCImage src="6be390d0-4479-4a98-8c7a-10257ea5585a" />
		</video>
		<button
			className="absolute bottom-0 mb-16"
			type="button"
			onClick={() => {
				document.querySelector("#avatar-profiles")?.scrollIntoView();
			}}
		>
			<ChevronDownIcon className="w-12 animate-bounce" />
		</button>
	</SnapSection>
);
