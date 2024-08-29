import { useInView } from "react-intersection-observer";
import Link from "next/link";

import { ButtonLink } from "~/components/button";
import { MobileButton } from "~/components/mobile-button";
import { urls } from "~/urls";
import {
	AppleIcon,
	GooglePlayIcon,
	MetaIcon,
	MicrosoftIcon
} from "~/components/icons";
import { Footer } from "~/components/layout/footer";
import { FlirtualLogo } from "~/components/logo";

import { SnapSection } from "../snap-section";

import type { TileProps } from "../page";

export const CallToAction: React.FC<TileProps> = ({ id, onVisible }) => {
	const [ref] = useInView({ onChange: (inView) => inView && onVisible() });

	return (
		<SnapSection data-tile={id}>
			<div className="flex h-full grow flex-col items-center justify-center px-8 pb-8 pt-20 desktop:px-20">
				<div className="-mt-32 flex flex-col items-center gap-16 desktop:mt-16">
					<div className="flex flex-col items-center gap-4">
						<FlirtualLogo className="w-56" />
						<h1
							ref={ref}
							className="max-w-screen-wide text-balance text-center text-4xl font-bold text-white-10 desktop:text-8xl"
						>
							Finding your{" "}
							<span className="overflow-visible bg-brand-gradient bg-clip-text italic text-transparent">
								special someone
							</span>{" "}
							has never been easier
						</h1>
					</div>
					<div className="hidden grid-cols-2 flex-col gap-2 desktop:grid">
						<ButtonLink href={urls.register} kind="primary">
							Sign up
						</ButtonLink>
						<ButtonLink href={urls.login()} kind="secondary">
							Log in
						</ButtonLink>
					</div>
					<div className="flex flex-col items-center gap-4 native:hidden vision:hidden">
						<div className="flex flex-wrap justify-center gap-4 gap-y-2 desktop:grid desktop:grid-cols-2">
							<MobileButton
								href={urls.apps.apple}
								Icon={AppleIcon}
								label="App Store"
								className="hidden web:flex apple:flex"
							/>
							<MobileButton
								href={urls.apps.google}
								Icon={GooglePlayIcon}
								label="Google Play"
								className="hidden web:flex android:flex"
							/>
							<MobileButton
								href={urls.apps.microsoft}
								Icon={MicrosoftIcon}
								label="Microsoft Store"
								className="hidden web:flex"
							/>
							<MobileButton
								href={urls.apps.sideQuest}
								Icon={MetaIcon}
								label="SideQuest"
								className="hidden web:flex"
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
				<Footer className="mt-auto bg-transparent" desktopOnly />
			</div>
		</SnapSection>
	);
};
