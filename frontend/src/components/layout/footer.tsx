"use client";

import { EnvelopeIcon } from "@heroicons/react/24/solid";
import React, { useCallback } from "react";

import { IconComponent } from "../icons";
import { DiscordIcon } from "../icons/discord";
import { TwitterIcon } from "../icons/twitter";
import { FlirtualLogo } from "../logo";

type LinkOrButtonProps<T> = T &
	(Pick<React.ComponentProps<"a">, "href"> | Pick<React.ComponentProps<"button">, "onClick">);

type FooterListIconLinkProps = LinkOrButtonProps<{ Icon: IconComponent }>;

const FooterListIconLink: React.FC<FooterListIconLinkProps> = ({ Icon, ...props }) =>
	"href" in props ? (
		<a className="cursor-pointer hover:brightness-90" {...props}>
			<Icon className="w-8" />
		</a>
	) : (
		<button className="cursor-pointer hover:brightness-90" type="button" {...props}>
			<Icon className="w-8" />
		</button>
	);

type FooterListLinkProps = LinkOrButtonProps<{
	label: string;
}>;

const FooterListLink: React.FC<FooterListLinkProps> = (props) => (
	<li className="cursor-pointer text-lg hover:underline md:text-xl">
		{"href" in props ? (
			<a {...props}>{props.label}</a>
		) : (
			<button {...props} type="button">
				{props.label}
			</button>
		)}
	</li>
);

export const Footer: React.FC = () => {
	const openFreshworks = useCallback(() => window.FreshworksWidget("open"), []);

	return (
		<footer className="flex font-nunito bg-brand-gradient w-full justify-center px-8 sm:py-16 text-white md:px-16">
			<div className="hidden sm:flex w-full max-w-screen-lg flex-col gap-4 p-4 md:gap-8">
				<div className="flex gap-4 md:mx-auto md:justify-center">
					<FooterListIconLink Icon={EnvelopeIcon} onClick={openFreshworks} />
					<FooterListIconLink href="/discord" Icon={DiscordIcon} />
					<FooterListIconLink href="https://twitter.com/getflirtual" Icon={TwitterIcon} />
				</div>
				<ul className="flex max-w-screen-sm flex-wrap gap-x-4 gap-y-1 md:mx-auto md:justify-center">
					<FooterListLink href="/events" label="Events" />
					<FooterListLink label="Support" onClick={openFreshworks} />
					<FooterListLink href="https://status.flirtu.al/" label="Status" />
					<FooterListLink href="/press" label="Press" />
					<FooterListLink href="/branding" label="Branding" />
					<FooterListLink href="/developers" label="Developers" />
					<FooterListLink href="/about" label="About us" />
					<FooterListLink href="/terms" label="Terms of Service" />
					<FooterListLink href="/privacy" label="Privacy Policy" />
				</ul>
				<div className="flex justify-between md:text-lg">
					<span className="hidden sm:inline">Made with ♥︎ in VR</span>
					<span>
						© {new Date().getFullYear()}{" "}
						<a className="hover:underline" href="https://studiopaprika.io/">
							Studio Paprika
						</a>
					</span>
				</div>
			</div>
		</footer>
	);
};
