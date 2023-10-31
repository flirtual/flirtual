"use client";

import { ChevronDown } from "lucide-react";

import { urls } from "~/urls";
import { FlirtualLogo } from "~/components/logo";

import { BackgroundVideo } from "./background-video";
import { LandingButton } from "./landing-button";
import { SnapSection } from "./snap-section";

export const SectionCallToAction: React.FC = () => (
	<SnapSection
		className="relative flex flex-col items-center justify-center font-montserrat"
		id="call-to-action"
	>
		<div className="z-10 flex flex-col items-center px-8 pb-12 md:px-16">
			<FlirtualLogo />
			<h1 className="text-center text-2xl font-bold sm:text-4xl md:text-6xl">
				The first VR dating app
			</h1>
			<div className="mt-8 flex flex-col gap-4 gap-y-8 md:flex-row">
				<LandingButton href={urls.register} kind="primary">
					Sign up
				</LandingButton>
				<LandingButton href={urls.login()} kind="secondary">
					Login
				</LandingButton>
			</div>
		</div>
		<BackgroundVideo />
		<button
			className="absolute bottom-0 z-10 mb-16"
			type="button"
			onClick={() => {
				document.querySelector("#avatar-profiles")?.scrollIntoView();
			}}
		>
			<ChevronDown className="h-12 w-12 animate-bounce" />
		</button>
	</SnapSection>
);
