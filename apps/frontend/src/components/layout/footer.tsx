import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";
import {
	type IconComponent,
	DiscordIcon,
	TwitterIcon
} from "~/components/icons";

import { FooterIconSupportLink, FooterSupportLink } from "./support-button";
import { FooterCannyLink } from "./canny-button";
import { MadeWithLove } from "./made-with-love";

type LinkOrButtonProps<T> = T &
	(
		| Pick<React.ComponentProps<"a">, "href">
		| Pick<React.ComponentProps<"button">, "onClick">
	);

type FooterListIconLinkProps = LinkOrButtonProps<{ Icon: IconComponent }>;

export const FooterListIconLink: React.FC<FooterListIconLinkProps> = ({
	Icon,
	...props
}) =>
	"href" in props ? (
		<a
			className="touch-callout-default cursor-pointer hover:brightness-90"
			{...props}
		>
			<Icon className="size-6 desktop:size-8" />
		</a>
	) : (
		<button
			className="cursor-pointer hover:brightness-90"
			type="button"
			{...props}
		>
			<Icon className="size-6 desktop:size-8" />
		</button>
	);

type FooterListLinkProps = LinkOrButtonProps<{
	label: string;
}>;

export const FooterListLink: React.FC<FooterListLinkProps> = (props) => (
	<li className="cursor-pointer hover:underline desktop:text-xl">
		{"href" in props ? (
			<a {...props}>{props.label}</a>
		) : (
			<button {...props} className="hover:underline" type="button">
				{props.label}
			</button>
		)}
	</li>
);

export type FooterProps = React.ComponentProps<"footer"> & {
	desktopOnly?: boolean;
};

export const Footer: React.FC<FooterProps> = ({ desktopOnly, ...props }) => {
	return (
		<footer
			{...props}
			className={twMerge(
				"w-full select-none justify-center bg-brand-gradient px-8 py-12 font-nunito text-white-10 desktop:p-16",
				desktopOnly ? "hidden desktop:flex" : "flex",
				props.className
			)}
		>
			<div className="max-w-screen-lg flex w-full flex-col gap-4 desktop:gap-8">
				<div className="flex items-center gap-8 desktop:mx-auto desktop:justify-center">
					<div className="flex gap-4">
						<FooterIconSupportLink />
						<FooterListIconLink
							href={urls.socials.discord}
							Icon={DiscordIcon}
						/>
						<FooterListIconLink
							href={urls.socials.twitter}
							Icon={TwitterIcon}
						/>
					</div>
				</div>
				<div className="max-w-screen-sm flex flex-col desktop:mx-auto">
					<ul className="flex flex-wrap gap-x-4 desktop:justify-center">
						<FooterListLink href={urls.resources.events} label="Events" />
						<FooterSupportLink />
						<FooterCannyLink />
						<FooterListLink
							href={urls.resources.networkStatus}
							label="Status"
						/>
					</ul>
					<ul className="flex flex-wrap gap-x-4 desktop:justify-center">
						<FooterListLink href={urls.resources.about} label="About" />
						<FooterListLink href={urls.resources.press} label="Press" />
						<FooterListLink href={urls.resources.branding} label="Branding" />
						<FooterListLink
							href={urls.resources.developers}
							label="Developers"
						/>
					</ul>
					<ul className="flex flex-wrap gap-x-4 desktop:justify-center">
						<FooterListLink
							href={urls.resources.communityGuidelines}
							label="Community Guidelines"
						/>
						<FooterListLink
							href={urls.resources.termsOfService}
							label="Terms"
						/>
						<FooterListLink
							href={urls.resources.privacyPolicy}
							label="Privacy"
						/>
					</ul>
				</div>
				<div className="flex justify-between desktop:text-lg">
					<MadeWithLove />
					<span>&copy; {new Date().getFullYear()} Flirtual</span>
				</div>
			</div>
		</footer>
	);
};
