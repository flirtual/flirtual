"use client";

import { ChevronDown } from "lucide-react";

import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

import { BackgroundVideo } from "./background-video";
import { LandingButton } from "./landing-button";
import { SnapSection } from "./snap-section";

export const SectionCallToAction: React.FC = () => {
	return (
		<SnapSection
			className="relative flex flex-col items-center justify-center font-montserrat"
			id="call-to-action"
		>
			<div className="z-10 flex flex-col items-center px-8 pb-12 desktop:px-16">
				<FlirtualLogo className="text-[snow]" />
				<h1 className="text-center text-2xl font-bold text-white-10 desktop:text-6xl">
					The first VR dating app
				</h1>
				<div className="mt-8 flex flex-col gap-4 gap-y-8 desktop:flex-row">
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
				<ChevronDown className="size-12 animate-bounce" />
			</button>
		</SnapSection>
	);
};
