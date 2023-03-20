import Link from "next/link";

import { urls } from "~/urls";

import { InlineLink } from "../inline-link";
import { Popover, PopoverModel } from "../popover";
import { DiscordIcon, TwitterIcon } from "../icons";
import { InstagramIcon } from "../icons/brand/instagram";

import { HeaderLogo } from "./header-logo";
import { NavigationInner } from "./navigation";
import { HeaderSupportButton } from "./support-button";
import { HeaderMessage } from "./header-message";

export const Header: React.FC = () => {
	return (
		<header className="flex w-full flex-col bg-brand-gradient text-white-20 shadow-brand-1">
			<HeaderMessage className="hidden sm:flex">
				Download the{" "}
				<InlineLink
					className="font-semibold before:absolute before:left-0 before:top-0 before:h-full before:w-full"
					highlight={false}
					href="/download"
				>
					{" "}
					mobile app
				</InlineLink>{" "}
				for a better experience!
			</HeaderMessage>
			<div className="top-0 z-10 hidden w-full flex-col  items-center justify-center bg-brand-gradient shadow-brand-1 sm:flex">
				<div className="flex w-full max-w-screen-lg items-center justify-between gap-8 px-8 py-4">
					<HeaderLogo />
					<div className="flex items-center gap-8 font-montserrat text-lg font-semibold">
						<nav className="flex gap-4">
							<InlineLink highlight={false} href={urls.resources.about}>
								About us
							</InlineLink>
							<Popover className="hidden lg:block">
								<button type="button">Community</button>
								<PopoverModel>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Available on</span>
										<InlineLink
											className="flex items-center gap-2"
											highlight={false}
											href={urls.socials.twitter}
										>
											<TwitterIcon className="w-5" />
											<span>Twitter</span>
										</InlineLink>
										<InlineLink
											className="flex items-center gap-2"
											highlight={false}
											href={urls.socials.instagram}
										>
											<InstagramIcon className="w-5" />
											<span>Instagram</span>
										</InlineLink>
										<InlineLink
											className="flex items-center gap-2"
											highlight={false}
											href={urls.socials.discord}
										>
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
										<InlineLink highlight={false} href={urls.resources.networkStatus}>
											Network Status
										</InlineLink>
										<HeaderSupportButton />
									</div>
								</PopoverModel>
							</Popover>
							<Popover className="hidden lg:block">
								<button type="button">Legal</button>
								<PopoverModel>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Documents</span>
										<InlineLink highlight={false} href={urls.resources.termsOfService}>
											Terms of Service
										</InlineLink>
										<InlineLink highlight={false} href={urls.resources.privacyPolicy}>
											Privacy Policy
										</InlineLink>
									</div>
									<div className="flex flex-col">
										<span className="mb-2 text-sm font-bold uppercase">Company</span>
										<InlineLink highlight={false} href={urls.resources.company}>
											Studio Paprika
										</InlineLink>
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
