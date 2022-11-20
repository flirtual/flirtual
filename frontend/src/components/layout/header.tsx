"use client";

import { ArrowLongRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { Instagram, Twitter, Discord } from "@icons-pack/react-simple-icons";

import { useFreshworks } from "~/hooks/use-freshworks";
import { discordUrl, instagramUrl, twitterUrl } from "~/const";

import { InlineLink } from "../inline-link";
import { FlirtualLogo } from "../logo";
import { InlineButton } from "../inline-button";

import { NavigationInner } from "./navigation";

const NavigationalMessage: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => (
	<div {...props} className={twMerge("flex w-full justify-center bg-brand-black", props.className)}>
		<div className="relative flex w-full max-w-screen-lg items-center justify-center px-8 py-4">
			<div className="relative flex gap-4 font-montserrat leading-none sm:text-lg">
				<ArrowLongRightIcon className="w-6 animate-bounce-x" />
				<span>{children}</span>
			</div>
			<XMarkIcon className="absolute right-8 w-6" strokeWidth={2} />
		</div>
	</div>
);

const Popover: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => {
	return (
		<div {...props} className={twMerge("group relative", props.className)}>
			{children}
		</div>
	);
};

const PopoverModel: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => (
	<div
		{...props}
		className={twMerge(
			"pointer-events-none absolute -left-6 z-50 flex pt-2 opacity-0 transition-opacity group-hocus-within:pointer-events-auto group-hocus-within:opacity-100",
			props.className
		)}
	>
		<div className="flex w-max flex-col gap-4 rounded-xl bg-brand-white py-4 px-6 text-base font-medium text-brand-black shadow-brand-1">
			{children}
		</div>
	</div>
);

export const Header: React.FC = () => {
	const { openFreshworks } = useFreshworks();

	return (
		<header className="flex w-full flex-col bg-brand-gradient text-brand-white shadow-brand-1">
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
										<InlineLink className="flex items-center gap-2" href={twitterUrl}>
											<Twitter className="w-5" />
											<span>Twitter</span>
										</InlineLink>
										<InlineLink className="flex items-center gap-2" href={instagramUrl}>
											<Instagram className="w-5" />
											<span>Instagram</span>
										</InlineLink>
										<InlineLink className="flex items-center gap-2" href={discordUrl}>
											<Discord className="w-5" />
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
										<InlineLink href="https://status.flirtu.al/">Network Status</InlineLink>
										<InlineButton onClick={openFreshworks}>Contact us</InlineButton>
									</div>
								</PopoverModel>
							</Popover>
							<Popover className="hidden lg:block">
								<button type="button">Legal</button>
								<PopoverModel>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Documents</span>
										<InlineLink href="/terms">Terms of Service</InlineLink>
										<InlineLink href="/privacy">Privacy Policy</InlineLink>
									</div>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Company</span>
										<InlineLink href="https://studiopaprika.io/">Studio Paprika</InlineLink>
									</div>
								</PopoverModel>
							</Popover>
						</nav>
						<Link className="rounded-xl bg-brand-black px-6 py-3 shadow-brand-1" href="/download">
							<span className="font-semibold">Download</span>
						</Link>
					</div>
				</div>
				<NavigationInner />
			</div>
		</header>
	);
};
