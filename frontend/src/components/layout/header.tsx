"use client";

import { ArrowLongRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { useFreshworks } from "~/hooks/use-freshworks";
import { urls } from "~/urls";

import { InlineLink } from "../inline-link";
import { FlirtualLogo } from "../logo";
import { InlineButton } from "../inline-button";
import { Popover, PopoverModel } from "../popover";
import { DiscordIcon, TwitterIcon } from "../icons";
import { InstagramIcon } from "../icons/brand/instagram";

import { NavigationInner } from "./navigation";

const NavigationalMessage: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => (
	<div
		{...props}
		className={twMerge("flex w-full justify-center bg-black-70 text-white-20", props.className)}
	>
		<div className="relative flex w-full max-w-screen-lg items-center justify-center px-8 py-4">
			<div className="relative flex gap-4 font-montserrat leading-none sm:text-lg">
				<ArrowLongRightIcon className="w-6 animate-bounce-x" />
				<span>{children}</span>
			</div>
			<XMarkIcon className="absolute right-8 w-6" strokeWidth={2} />
		</div>
	</div>
);

export const Header: React.FC = () => {
	const { openFreshworks } = useFreshworks();

	return (
		<header className="flex w-full flex-col bg-brand-gradient text-white-20 shadow-brand-1">
			<NavigationalMessage className="hidden sm:flex">
				Download the{" "}
				<InlineLink
					className="font-semibold before:absolute before:left-0 before:top-0 before:h-full before:w-full"
					href="/download"
				>
					{" "}
					mobile app
				</InlineLink>{" "}
				for a better experience!
			</NavigationalMessage>
			<div className="top-0 z-10 hidden w-full flex-col  items-center justify-center bg-brand-gradient shadow-brand-1 sm:flex">
				<div className="flex w-full max-w-screen-lg items-center justify-between gap-8 px-8 py-4">
					<FlirtualLogo className="h-16 shrink-0" />
					<div className="flex items-center gap-8 font-montserrat text-lg font-semibold">
						<nav className="flex gap-4">
							<InlineLink href="/about">About us</InlineLink>
							<Popover className="hidden lg:block">
								<button type="button">Community</button>
								<PopoverModel>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Available on</span>
										<InlineLink className="flex items-center gap-2" href={urls.socials.twitter()}>
											<TwitterIcon className="w-5" />
											<span>Twitter</span>
										</InlineLink>
										<InlineLink className="flex items-center gap-2" href={urls.socials.instagram()}>
											<InstagramIcon className="w-5" />
											<span>Instagram</span>
										</InlineLink>
										<InlineLink className="flex items-center gap-2" href={urls.socials.discord()}>
											<DiscordIcon className="w-5" />
											<span>Discord</span>
										</InlineLink>
									</div>
								</PopoverModel>
							</Popover>
							<Popover className="hidden lg:block">
								<button type="button">Support</button>
								<PopoverModel>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Service</span>
										<InlineLink href={urls.resources.networkStatus()}>Network Status</InlineLink>
										<InlineButton onClick={openFreshworks}>Contact us</InlineButton>
									</div>
								</PopoverModel>
							</Popover>
							<Popover className="hidden lg:block">
								<button type="button">Legal</button>
								<PopoverModel>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Documents</span>
										<InlineLink href={urls.resources.termsOfService()}>Terms of Service</InlineLink>
										<InlineLink href={urls.resources.privacyPolicy()}>Privacy Policy</InlineLink>
									</div>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Company</span>
										<InlineLink href={urls.resources.company()}>Studio Paprika</InlineLink>
									</div>
								</PopoverModel>
							</Popover>
						</nav>
						<Link className="rounded-xl bg-black-70 px-6 py-3 shadow-brand-1" href="/download">
							<span className="font-semibold">Download</span>
						</Link>
					</div>
				</div>
				<NavigationInner />
			</div>
		</header>
	);
};
