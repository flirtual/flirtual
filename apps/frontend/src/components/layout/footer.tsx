import { twMerge } from "tailwind-merge";

import { FooterIconSupportLink, FooterSupportLink } from "./support-button";
import { FooterCannyLink } from "./canny-button";

import { urls } from "~/urls";
import { IconComponent, DiscordIcon, TwitterIcon } from "~/components/icons";

type LinkOrButtonProps<T> = T &
	(Pick<React.ComponentProps<"a">, "href"> | Pick<React.ComponentProps<"button">, "onClick">);

type FooterListIconLinkProps = LinkOrButtonProps<{ Icon: IconComponent }>;

export const FooterListIconLink: React.FC<FooterListIconLinkProps> = ({ Icon, ...props }) =>
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

export const FooterListLink: React.FC<FooterListLinkProps> = (props) => (
	<li className="cursor-pointer hover:underline sm:text-lg md:text-xl">
		{"href" in props ? (
			<a {...props}>{props.label}</a>
		) : (
			<button {...props} className="hover:underline" type="button">
				{props.label}
			</button>
		)}
	</li>
);

export type FooterProps = React.ComponentProps<"footer"> & { desktopOnly?: boolean };

export const Footer: React.FC<FooterProps> = ({ desktopOnly, ...props }) => {
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
						<FooterIconSupportLink />
						<FooterListIconLink href={urls.socials.discord} Icon={DiscordIcon} />
						<FooterListIconLink href={urls.socials.twitter} Icon={TwitterIcon} />
					</div>
				</div>
				<div className="flex max-w-screen-sm flex-col md:mx-auto">
					<ul className="flex flex-wrap gap-x-4 md:justify-center">
						<FooterListLink href={urls.resources.events} label="Events" />
						<FooterSupportLink />
						<FooterCannyLink />
						<FooterListLink href={urls.resources.networkStatus} label="Status" />
					</ul>
					<ul className="flex flex-wrap gap-x-4 md:justify-center">
						<FooterListLink href={urls.resources.about} label="About" />
						<FooterListLink href={urls.resources.press} label="Press" />
						<FooterListLink href={urls.resources.branding} label="Branding" />
						<FooterListLink href={urls.resources.developers} label="Developers" />
					</ul>
					<ul className="flex flex-wrap gap-x-4 md:justify-center">
						<FooterListLink
							href={urls.resources.communityGuidelines}
							label="Community Guidelines"
						/>
						<FooterListLink href={urls.resources.termsOfService} label="Terms" />
						<FooterListLink href={urls.resources.privacyPolicy} label="Privacy" />
					</ul>
				</div>
				<div className="flex justify-between md:text-lg">
					<span className="hidden sm:inline">Made with ♥︎ in VR</span>
					<span>
						© {new Date().getFullYear()}{" "}
						<a className="hover:underline" href={urls.resources.company}>
							Studio Paprika
						</a>
					</span>
				</div>
			</div>
		</footer>
	);
};
