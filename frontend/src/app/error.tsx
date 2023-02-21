"use client";

import { InlineLink } from "~/components/inline-link";
import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="flex min-h-screen w-full justify-center bg-brand-gradient px-8 py-16 text-white-10 sm:items-center">
			<div className="flex flex-col justify-between gap-8 sm:justify-start">
				<div className="flex flex-col gap-8">
					<FlirtualLogo className="w-64" />
					<h1 className="font-montserrat text-2xl font-semibold sm:text-3xl">
						We&apos;re having some
						<br className="hidden sm:block" /> troubles right now.
					</h1>
					<div className="flex flex-col font-nunito">
						<p>
							We&apos;re figuring things out, but we&apos;ll be back soon!
							<br className="hidden sm:block" /> Thank you for your patience!
						</p>
					</div>
				</div>
				<div className="flex flex-col">
					<div>
						<InlineLink href={urls.socials.discord()}>Discord</InlineLink>
						{" • "}
						<InlineLink href={urls.socials.twitter()}>Twitter</InlineLink>
						{" • "}
						<InlineLink href={urls.resources.networkStatus()}>Network Status</InlineLink>
					</div>
					<footer>&copy; 2022 Studio Paprika</footer>
				</div>
			</div>
		</div>
	);
}
