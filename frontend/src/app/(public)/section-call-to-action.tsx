"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";

import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

import { BackgroundVideo } from "./background-video";
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
		<BackgroundVideo />
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
