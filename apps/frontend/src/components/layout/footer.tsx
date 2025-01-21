"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import {
	DiscordIcon,
	type IconComponent,
	TwitterIcon
} from "~/components/icons";
import { gitCommitSha, gitCommitUrl } from "~/const";
import { urls } from "~/urls";

import { InlineLink } from "../inline-link";
import { InputLanguageSelect } from "../inputs/specialized/language-select";
import { Link } from "../link";
import { FlirtualLogo } from "../logo";
import { FooterCannyLink } from "./canny-button";
import { MadeWithLove } from "./made-with-love";
import { FooterIconSupportLink, FooterSupportLink } from "./support-button";

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
	"href" in props
		? (
				<a
					className="touch-callout-default cursor-pointer hover:brightness-90"
					{...props}
				>
					<Icon className="size-6 desktop:size-8" />
				</a>
			)
		: (
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

export const FooterListLink: React.FC<FooterListLinkProps> = ({ label, ...props }) => (
	<li className="cursor-pointer hover:underline">
		{"href" in props
			? (<Link href={props.href || null} {...props}>{label}</Link>)
			: (
					<button {...props} className="hover:underline" type="button">
						{label}
					</button>
				)}
	</li>
);

export type FooterProps = {
	desktopOnly?: boolean;
	background?: boolean;
	logoClassName?: string;
} & React.ComponentProps<"footer">;

export const Footer: React.FC<FooterProps> = ({
	desktopOnly,
	background = true,
	logoClassName,
	...props
}) => {
	const t = useTranslations();

	return (
		<footer
			{...props}
			className={twMerge(
				"-mt-1 w-full justify-center px-8 py-12 font-nunito desktop:pb-36 wide:pb-20",
				desktopOnly ? "hidden desktop:flex" : "flex",
				background
				&& "border-t-4 border-theme-1 dark:text-white-20 desktop:bg-white-20 desktop:p-16 desktop:shadow-brand-inset dark:desktop:bg-black-70",
				props.className
			)}
		>
			<div className="flex w-full max-w-screen-wide flex-col gap-4 desktop:gap-8">
				<div className="flex justify-between gap-8">
					<div className="flex items-center gap-8">
						<Link href={urls.landing}>
							<FlirtualLogo
								className={twMerge(
									"w-36 text-black-80 dark:text-[snow]",
									logoClassName
								)}
							/>
						</Link>
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
					<InputLanguageSelect className="w-56 shrink-0" />
				</div>
				<div className="grid max-w-screen-desktop grid-cols-3 gap-x-4 desktop:justify-center">
					<ul>
						<FooterListLink href={urls.resources.events} label={t("events")} />
						<FooterSupportLink />
						<FooterCannyLink />
						<FooterListLink
							href={urls.resources.networkStatus}
							label={t("status")}
						/>
					</ul>
					<ul>
						<FooterListLink href={urls.resources.about} label={t("about")} />
						<FooterListLink href={urls.resources.press} label={t("press")} />
						<FooterListLink
							href={urls.resources.branding}
							label={t("branding")}
						/>
						<FooterListLink
							href={urls.resources.developers}
							label={t("developers")}
						/>
					</ul>
					<ul>
						<FooterListLink
							href={urls.resources.communityGuidelines}
							label={t("community_guidelines")}
						/>
						<FooterListLink
							href={urls.resources.termsOfService}
							label={t("terms_of_service")}
						/>
						<FooterListLink
							href={urls.resources.privacyPolicy}
							label={t("privacy_policy")}
						/>
					</ul>
				</div>
				<div className="flex justify-between gap-2">
					<MadeWithLove />
					<div className="flex flex-col items-end">
						<span>{t("copyright", { year: new Date().getFullYear() })}</span>
						<InlineLink
							className="text-sm opacity-75"
							highlight={false}
							href={gitCommitUrl}
						>
							{gitCommitSha.slice(0, 8)}
						</InlineLink>
					</div>
				</div>
			</div>
		</footer>
	);
};
