"use client";

import { InlineLink } from "~/components/inline-link";
import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
						<InlineLink highlight={false} href={urls.socials.discord}>
							Discord
						</InlineLink>
						{" • "}
						<InlineLink highlight={false} href={urls.socials.twitter}>
							Twitter
						</InlineLink>
						{" • "}
						<InlineLink highlight={false} href={urls.resources.networkStatus}>
							Network Status
						</InlineLink>
					</div>
					<footer>
						© {new Date().getFullYear()}{" "}
						<a className="hover:underline" href={urls.resources.company}>
							Studio Paprika
						</a>
					</footer>
				</div>
			</div>
		</div>
	);
}
