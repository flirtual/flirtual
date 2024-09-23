import Link from "next/link";
import { useTranslations } from "next-intl";

import { ButtonLink } from "~/components/button";
import { DownloadButton } from "~/components/download-button";
import { urls } from "~/urls";
import {
	AppleIcon,
	GooglePlayIcon,
	MetaIcon,
	MicrosoftIcon
} from "~/components/icons";
import { Footer } from "~/components/layout/footer";
import { FlirtualLogo } from "~/components/logo";

import { SignUpButton } from "../sign-up-button";

import { Tile, TileAnchor, type TileProps } from ".";

export function CallToAction({ id }: TileProps) {
	const t = useTranslations();

	return (
		<Tile className="h-auto !min-h-inherit content-center" id={id}>
			<div className="-mt-32 flex grow flex-col items-center px-8 pb-8 desktop:mt-0 desktop:px-24">
				<div className="flex flex-col items-center gap-16 desktop:tall:mt-16">
					<div className="flex flex-col items-center gap-4">
						<FlirtualLogo className="w-56" />
						<TileAnchor id={id}>
							<h1
								a={1}
								className="max-w-screen-wide text-balance text-center text-4xl font-bold text-white-10 desktop:text-5xl desktop:tall:text-8xl"
								foo={1}
							>
								{t.rich("landing.cta.few_grassy_hyena_adapt", {
									highlight: (children) => (
										<span className="overflow-visible bg-brand-gradient bg-clip-text italic text-transparent wide:block">
											{children}
										</span>
									)
								})}
							</h1>
						</TileAnchor>
					</div>
					<div className="hidden grid-cols-2 flex-col gap-2 desktop:grid">
						<SignUpButton />
						<ButtonLink href={urls.login()} kind="secondary">
							{t("landing.log_in")}
						</ButtonLink>
					</div>
					<div className="flex flex-col items-center gap-4 native:hidden vision:hidden">
						<div className="flex w-fit flex-wrap justify-center gap-4 gap-y-2 desktop:grid desktop:grid-cols-2">
							<DownloadButton
								className="hidden apple:flex desktop:flex"
								platform="apple"
							/>
							<DownloadButton
								className="hidden android:flex desktop:flex"
								platform="google"
							/>
							<DownloadButton
								className="hidden desktop:flex"
								platform="microsoft"
							/>
							<DownloadButton
								className="hidden desktop:flex"
								platform="side_quest"
							/>
						</div>
						<div className="flex gap-2 desktop:hidden">
							<Link className="apple:hidden" href={urls.apps.apple}>
								<AppleIcon className="size-6" />
							</Link>
							<Link className="android:hidden" href={urls.apps.google}>
								<GooglePlayIcon className="size-6" />
							</Link>
							<Link href={urls.apps.microsoft}>
								<MicrosoftIcon className="size-6" />
							</Link>
							<Link href={urls.apps.sideQuest}>
								<MetaIcon className="size-6" />
							</Link>
						</div>
					</div>
				</div>
				<Footer
					desktopOnly
					background={false}
					className="mt-auto bg-transparent pt-32 desktop:pb-12"
					logoClassName="text-[snow]"
				/>
			</div>
		</Tile>
	);
}
