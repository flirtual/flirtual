"use client";

import { EnvelopeIcon, MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Twitter, Discord } from "@icons-pack/react-simple-icons";

import { useFreshworks } from "~/hooks/use-freshworks";
import { useTheme } from "~/hooks/use-theme";
import { urls } from "~/urls";

import { IconComponent } from "../icons";

type LinkOrButtonProps<T> = T &
	(Pick<React.ComponentProps<"a">, "href"> | Pick<React.ComponentProps<"button">, "onClick">);

type FooterListIconLinkProps = LinkOrButtonProps<{ Icon: IconComponent }>;

const FooterListIconLink: React.FC<FooterListIconLinkProps> = ({ Icon, ...props }) =>
	"href" in props ? (
		<a className="cursor-pointer hover:brightness-90" {...props}>
			<Icon className="h-6 w-6 sm:h-8 sm:w-8" />
		</a>
	) : (
		<button className="cursor-pointer hover:brightness-90" type="button" {...props}>
			<Icon className="h-6 w-6 sm:h-8 sm:w-8" />
		</button>
	);

type FooterListLinkProps = LinkOrButtonProps<{
	label: string;
}>;

const FooterListLink: React.FC<FooterListLinkProps> = (props) => (
	<li className="cursor-pointer hover:underline sm:text-lg md:text-xl">
		{"href" in props ? (
			<a {...props}>{props.label}</a>
		) : (
			<button {...props} type="button">
				{props.label}
			</button>
		)}
	</li>
);

export type FooterProps = React.ComponentProps<"footer"> & { desktopOnly?: boolean };

export const Footer: React.FC<FooterProps> = ({ desktopOnly, ...props }) => {
	const { openFreshworks } = useFreshworks();
	const { theme, setTheme } = useTheme();

	return (
		<footer
			{...props}
			className={twMerge(
				"w-full justify-center bg-brand-gradient px-8 py-12 font-nunito text-white-20 sm:p-16",
				desktopOnly ? "hidden sm:flex" : "flex",
				props.className
			)}
		>
			<div className="flex w-full max-w-screen-lg flex-col gap-4 md:gap-8">
				<div className="flex items-center gap-8 md:mx-auto md:justify-center">
					<div className="flex gap-4">
						<FooterListIconLink Icon={EnvelopeIcon} onClick={openFreshworks} />
						<FooterListIconLink href={urls.socials.discord()} Icon={Discord} />
						<FooterListIconLink href={urls.socials.twitter()} Icon={Twitter} />
					</div>
					<FooterListIconLink
						Icon={theme === "dark" ? SunIcon : MoonIcon}
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					/>
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
