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
		<Tile id={id}>
			<div className="flex h-full grow flex-col items-center justify-center px-8 pb-8 pt-20 desktop:px-20">
				<div className="-mt-32 flex flex-col items-center gap-16 desktop:mt-16">
					<div className="flex flex-col items-center gap-4">
						<FlirtualLogo className="w-56" />
						<TileAnchor id={id}>
							<h1 className="max-w-screen-wide text-balance text-center text-4xl font-bold text-white-10 desktop:text-8xl">
								{t.rich("landing.cta.few_grassy_hyena_adapt", {
									highlight: (children) => (
										<span className="overflow-visible bg-brand-gradient bg-clip-text italic text-transparent">
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
								platform="apple"
								className="hidden apple:flex desktop:flex"
							/>
							<DownloadButton
								platform="google"
								className="hidden android:flex desktop:flex"
							/>
							<DownloadButton
								platform="microsoft"
								className="hidden desktop:flex"
							/>
							<DownloadButton
								platform="side_quest"
								className="hidden desktop:flex"
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
					className="mt-auto bg-transparent"
					background={false}
					desktopOnly
				/>
			</div>
		</Tile>
	);
}
