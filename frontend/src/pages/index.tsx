import React, { useRef, forwardRef, useState, useCallback, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link, { LinkProps } from "next/link";
import Head from "next/head";

import { UCImage } from "~/components/uc-image";
import { MobileButton } from "~/components/mobile-button";
import { GooglePlayIcon } from "~/components/icons/google-play";
import { AppleIcon } from "~/components/icons/apple";
import { MicrosoftIcon } from "~/components/icons/microsoft";
import { MetaIcon } from "~/components/icons/meta";
import { Footer } from "~/components/layout/footer";
import { useInterval } from "~/hooks/use-interval";
import { FlirtualLogo } from "~/components/logo";

const SnapSection = forwardRef<HTMLElement, React.ComponentProps<"section">>((props, ref) => (
	<section
		{...props}
		className={twMerge("w-full h-screen snap-always snap-center", props.className)}
		ref={ref}
	>
		{props.children}
	</section>
));

type LandingButtonProps = React.PropsWithChildren<
	LinkProps & {
		kind: "primary" | "secondary" | "secondary-cta";
	}
>;

const LandingButton: React.FC<LandingButtonProps> = (props) => (
	<Link
		{...props}
		className={twMerge(
			"font-montserrat font-extrabold shadow-brand-1 cursor-pointer rounded-xl text-center",
			{
				primary: "bg-brand-gradient p-4 w-48 text-2xl text-white",
				secondary: "text-brand-pink w-48 p-4 text-2xl bg-white",
				"secondary-cta": "text-brand-pink w-64 p-4 text-3xl bg-white"
			}[props.kind]
		)}
	>
		<span>{props.children}</span>
	</Link>
);

const AvatarProfileSection = forwardRef<HTMLElement, { values: Array<string> }>(
	({ values }, ref) => {
		const [activeIdx, setActiveIdx] = useState(0);

		useInterval(
			useCallback(() => {
				setActiveIdx((activeIdx) => (activeIdx + 1) % values.length);
			}, [values.length]),
			5000
		);

		const activeValue = values[activeIdx];

		return (
			<SnapSection className="bg-brand-gradient px-8 py-16 md:px-16" ref={ref}>
				<div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col items-center justify-center gap-8">
					<div className="flex flex-col items-center justify-center gap-8 text-center">
						<h1 className="font-montserrat mt-8 text-5xl font-extrabold md:text-7xl">
							Avatar profiles
						</h1>
						<span className="font-nunito font-normal h-[8ch] max-w-4xl text-2xl leading-snug sm:text-3xl md:h-[5ch] md:text-5xl">
							{activeValue}
						</span>
					</div>
					<img className="lg:h-[60vh]" src="/images/profile-showcase.png" />
				</div>
			</SnapSection>
		);
	}
);

export interface CarouselSectionProps {
	values: Array<[src: string, label: string]>;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({ values }) => {
	const [activeIdx, setActiveIdx] = useState(0);

	const next = useCallback(() => {
		setActiveIdx((activeIdx) => (activeIdx + 1) % values.length);
	}, [values.length]);

	const { reset } = useInterval(
		useCallback(() => next(), [next]),
		5000
	);

	return (
		<SnapSection className="relative">
			<div className="absolute z-10 flex w-full justify-center px-8 py-16 md:px-16">
				<span className="font-montserrat text-center text-2xl font-semibold [text-shadow:0_0_16px_#000] md:text-4xl">
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

interface TestimonialSectionProps {
	images: Array<string>;
	brands: Array<string>;
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ images, brands }) => {
	return (
		<SnapSection className="bg-brand-gradient grid grid-rows-[max-content,1fr,max-content]">
			<div className="flex items-center justify-center p-8 md:p-16">
				<span className="font-montserrat font-extrabold text-3xl md:text-5xl">
					Thousands of matches (and memories) made.
				</span>
			</div>
			<div className="flex overflow-x-hidden">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="animate-scroll-x-screen flex">
						{images.map((src) => (
							<UCImage className="h-full object-cover" key={src} src={src} />
						))}
					</div>
					<div className="animate-scroll-x-screen flex">
						{images.map((src) => (
							<UCImage className="h-full object-cover" key={src} src={src} />
						))}
					</div>
				</div>
			</div>
			<div className="m-8 flex flex-wrap items-center justify-evenly gap-8 md:m-16 md:flex-nowrap">
				{brands.map((src) => (
					<UCImage className="w-24 md:w-full" key={src} src={src} />
				))}
			</div>
		</SnapSection>
	);
};

export const RootIndexPage: React.FC = () => {
	const avatarSectionRef = useRef<HTMLElement>(null);

	return (
		<>
			<Head>
				<title>The First VR Dating App 💘🥽</title>
			</Head>
			<div className="h-screen snap-y snap-proximity overflow-x-hidden scroll-smooth bg-black text-white">
				<SnapSection className="font-montserrat relative flex flex-col items-center justify-center">
					<div className="z-10 flex flex-col items-center px-8 py-16 md:px-16">
						<FlirtualLogo />
						<h1 className="text-3xl font-bold sm:text-4xl md:text-6xl">The VR Dating App</h1>
						<div className="mt-8 flex flex-col gap-4 gap-y-8 md:flex-row">
							<LandingButton href="/register" kind="primary">
								Sign up
							</LandingButton>
							<LandingButton href="/login" kind="secondary">
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
						className="absolute bottom-0 mb-8"
						type="button"
						onClick={() => avatarSectionRef.current?.scrollIntoView()}
					>
						<ChevronDownIcon className="w-12 animate-bounce" />
					</button>
				</SnapSection>
				<AvatarProfileSection
					ref={avatarSectionRef}
					values={useMemo(
						() => [
							"When you can choose how you look, it's personality that makes the difference.",
							"VR lets you be more real.",
							"Vibe check in VR before sending IRL pics or video calling."
						],
						[]
					)}
				/>
				<CarouselSection
					values={useMemo(
						() => [
							["b9326c15-c996-488f-8d68-d7ea4cb8649b", "Feed some ducks"],
							["738f3d22-6f38-4059-9dd3-7fdd672acccd", "Swim with sharks"],
							["be840a83-86f9-4ba2-87ae-3cd93f73f099", "Chill in a cafe"],
							["107737a5-d694-43db-a082-0d71bdfc4105", "Observe a black hole"],
							["30023b24-f08a-43d4-918a-aa8940cefb24", "Touch grass"],
							["09402677-a01e-4f6b-9171-f8c533ec774f", "Paint together"],
							["7e736467-63c4-4ff4-9989-54546b24cc6f", "Play some pool"]
						],
						[]
					)}
				/>
				<TestimonialSection
					brands={useMemo(
						() => [
							"29a2f1bc-0b3e-469a-aa11-0de69b75b629",
							"257a7f46-a6c1-4bee-9a3e-5dbdfe9d2a66",
							"18e4a7ad-625a-42f6-b581-d14386ced012",
							"db2eb424-e837-4d64-85e0-e49409ae33a6",
							"54ffe640-1c54-4d8f-a754-4c7b7ca82456",
							"b779aa38-8592-48cd-8f9b-88228c5abc21",
							"1a03f086-7a3a-41f6-a7cf-035a83c10fa4",
							"fd92ab0f-d264-4a69-813f-bea13def2c46"
						],
						[]
					)}
					images={useMemo(
						() => [
							"a68e9441-8430-4a33-a067-04313d4d260c",
							"5e0d4116-2e60-4ae9-b865-3ce7d17c68ec",
							"01db5707-2aac-45cd-a80c-223c6e1b93f2",
							"b8ea7c5b-5110-46b7-8635-38728e8a77aa",
							"eea60bde-de1a-4f43-9f02-a218fddf2a73",
							"ad5cba2d-03ff-43eb-9cf3-e6986bb0be54",
							"40122187-d831-4131-ab8e-ee0f5544ce73",
							"17b87f45-0ef8-4dfa-80c4-c23450f09b30",
							"28eaf327-e2bd-4fd2-a7f9-4dd6be153bfc",
							"5bbf00fc-2c97-49b2-9f16-9d3c1a180ae8",
							"f3b27da8-4f36-4c7f-bd65-094421d28f22",
							"c0d8ad7f-a6df-4de8-a429-a8fa729bf447",
							"9f2de017-6b5a-4ca9-b858-95057889fd64",
							"b8b087b9-3ab3-4a05-b01a-166b502789f5"
						],
						[]
					)}
				/>
				<SnapSection className="bg-brand-gradient flex flex-col">
					<div className="flex h-full items-center justify-center p-16 pb-0 md:pb-16">
						<div className="flex flex-col items-center gap-8 md:gap-16">
							<h1 className="font-montserrat font-extrabold text-4xl sm:text-7xl md:text-8xl">
								Get Flirtual
							</h1>
							<LandingButton href="/register" kind="secondary-cta">
								Sign up
							</LandingButton>
							<div className="grid grid-cols-1 gap-4 gap-y-2 md:grid-cols-2">
								<MobileButton
									href="https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"
									Icon={GooglePlayIcon}
									label="Play Store"
								/>
								<MobileButton href="/ios" Icon={AppleIcon} label="iPhone/iPad" />
								<MobileButton
									href="https://apps.microsoft.com/store/detail/flirtual/9NWCSDGB6CS3?cid=storebadge&ocid=badge&rtc=1"
									Icon={MicrosoftIcon}
									label="Windows"
								/>
								<MobileButton
									href="https://sidequestvr.com/app/9195"
									Icon={MetaIcon}
									label="Side Quest"
								/>
							</div>
						</div>
					</div>
					<Footer />
				</SnapSection>
			</div>
		</>
	);
};

export default RootIndexPage;
