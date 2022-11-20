import { ArrowLongRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Instagram, Twitter, Discord } from "@icons-pack/react-simple-icons";

import { InlineLink } from "../inline-link";
import { FlirtualLogo } from "../logo";

import { NavigationInner } from "./navigation";

const NavigationalMessage: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => (
	<div {...props} className={twMerge("flex w-full justify-center bg-brand-black", props.className)}>
		<div className="flex w-full max-w-screen-lg items-center justify-center px-8 py-4">
			<div className="relative flex gap-4 font-montserrat leading-none sm:text-lg">
				<ArrowLongRightIcon className="w-6" />
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

export const Header: React.FC = () => (
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
		<div className="sticky top-0 hidden flex-col items-center justify-center sm:flex">
			<div className="flex w-full max-w-screen-lg items-center justify-between gap-8 px-8 py-4">
				<FlirtualLogo className="h-16 shrink-0" />
				<div className="flex items-center gap-8 font-montserrat text-lg font-semibold">
					<nav className="flex gap-4">
						<InlineLink href="/about">About us</InlineLink>
						<Popover>
							<button className="hidden lg:inline" type="button">
								Community
							</button>
							<PopoverModel>
								<div className="flex flex-col">
									<span className="mb-2 text-sm font-bold uppercase">Available on</span>
									<InlineLink
										className="flex items-center gap-2"
										href="https://twitter.com/getflirtual"
									>
										<Twitter className="w-5" />
										<span>Twitter</span>
									</InlineLink>
									<InlineLink className="flex items-center gap-2" href="/">
										<Instagram className="w-5" />
										<span>Instagram</span>
									</InlineLink>
									<InlineLink className="flex items-center gap-2" href="/">
										<Discord className="w-5" />
										<span>Discord</span>
									</InlineLink>
								</div>
								<div className="flex flex-col">
									<span className="mb-2 text-sm font-bold uppercase">Company</span>
									<InlineLink href="/">Studio Paprika</InlineLink>
								</div>
							</PopoverModel>
						</Popover>
						<Popover>
							<button className="hidden lg:inline" type="button">
								Support
							</button>
							<PopoverModel>
								<div className="flex flex-col">
									<span className="mb-2 text-sm font-bold uppercase">Service</span>
									<InlineLink href="/">Network Status</InlineLink>
									<InlineLink href="/">Contact us</InlineLink>
									<InlineLink href="/">Discord</InlineLink>
								</div>
								<div className="flex flex-col">
									<span className="mb-2 text-sm font-bold uppercase">Company</span>
									<InlineLink href="/">Studio Paprika</InlineLink>
								</div>
							</PopoverModel>
						</Popover>
						<Popover>
							<button className="hidden lg:inline" type="button">
								Legal
							</button>
							<PopoverModel>
								<div className="flex flex-col">
									<span className="mb-2 text-sm font-bold uppercase">Documents</span>
									<InlineLink href="/">Terms of Service</InlineLink>
									<InlineLink href="/">Privacy Policy</InlineLink>
								</div>
								<div className="flex flex-col">
									<span className="mb-2 text-sm font-bold uppercase">Company</span>
									<InlineLink href="/">Studio Paprika</InlineLink>
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
