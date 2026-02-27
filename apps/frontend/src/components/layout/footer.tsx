import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { InlineThemeSelect } from "~/app/[locale]/(app)/(authenticated)/settings/(account)/appearance/theme-preview";
import {
	DiscordIcon,

	TwitterIcon
} from "~/components/icons";
import type { IconComponent } from "~/components/icons";
import { commitIdShort } from "~/const";
import { useDialog } from "~/hooks/use-dialog";
import type { Theme } from "~/hooks/use-theme";
import { urls } from "~/urls";

import { InlineLink } from "../inline-link";
import { InlineLanguageSelect } from "../inputs/specialized/language-select";
import { Link } from "../link";
import { FlirtualLogo } from "../logo";
import { IdeasDialog } from "../modals/ideas";
import { MadeWithLove } from "./made-with-love";
import { FooterIconSupportLink, FooterSupportLink } from "./support-button";

type LinkOrButtonProps<T> = T
	& (
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
	<li>
		{"href" in props
			? (
					<Link
						{...props}
						className="hover:underline data-[active]:font-bold hover:data-[active]:no-underline"
						href={props.href || null}
					>
						{label}
					</Link>
				)
			: (
					<button
						{...props}
						className="cursor-pointer hover:underline"
						type="button"
					>
						{label}
					</button>
				)}
	</li>
);

export type FooterProps = {
	desktopOnly?: boolean;
	background?: boolean;
	logoTheme?: Theme;
} & React.ComponentProps<"footer">;

export const Footer: React.FC<FooterProps> = ({
	desktopOnly,
	background = true,
	logoTheme,
	...props
}) => {
	const { t } = useTranslation();
	const dialogs = useDialog();

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
							<FlirtualLogo className="w-36" theme={logoTheme} />
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
					<div className="flex items-center gap-4">
						<InlineThemeSelect />
						<InlineLanguageSelect />
					</div>
				</div>
				<div className="grid max-w-screen-desktop grid-cols-3 gap-x-4 desktop:justify-center">
					<ul>
						<FooterListLink href={urls.resources.events} label={t("events")} />
						<FooterSupportLink />
						<FooterListLink
							label={t("ideas")}
							onClick={() => {
								const dialog = <IdeasDialog onClose={() => dialogs.remove(dialog)} />;
								dialogs.add(dialog);
							}}
						/>
						<FooterListLink
							href={urls.news}
							label={t("updates")}
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
						<FooterListLink
							href={urls.resources.networkStatus}
							label={t("status")}
						/>
					</ul>
				</div>
				<div className="flex justify-between gap-2">
					<MadeWithLove />
					<div className="flex flex-col items-end">
						<span>{t("copyright", { year: new Date().getFullYear() })}</span>
						{" "}
						<InlineLink
							className="text-sm opacity-75"
							highlight={false}
							href={urls.debugger}
						>
							{commitIdShort}
						</InlineLink>
					</div>
				</div>
			</div>
		</footer>
	);
};
