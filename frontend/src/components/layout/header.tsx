import Link from "next/link";

import { urls } from "~/urls";

import { InlineLink } from "../inline-link";
import { Popover, PopoverModel } from "../popover";
import { DiscordIcon, TwitterIcon } from "../icons";

import { HeaderLogo } from "./header-logo";
import { NavigationInner } from "./navigation";
import { HeaderSupportButton } from "./support-button";
import { HeaderMessage } from "./header-message";

export const Header: React.FC = () => {
	return (
		<header className="fixed z-10 mt-[calc(-50vw+80px)] flex h-[50vw] w-[200vw] flex-col rounded-half bg-brand-gradient text-white-20 shadow-brand-1">
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
			<div className="fixed top-[8px] left-0 z-10  hidden w-full flex-col items-center justify-center sm:flex">
				<NavigationInner />
			</div>
		</header>
	);
};
