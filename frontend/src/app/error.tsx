"use client";

import { useRouter } from "next/navigation";

import { Button } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
	const router = useRouter();

	return (
		<div className="flex min-h-screen w-full justify-center bg-brand-gradient px-8 py-16 text-white-10 sm:items-center">
			<div className="flex flex-col justify-between gap-8 sm:justify-start">
				<div className="flex flex-col gap-8">
					<FlirtualLogo className="w-64" />
					<h1 className="font-montserrat text-2xl font-semibold sm:text-3xl">
						Something went wrong :(
					</h1>
					<div className="flex flex-col font-nunito">
						<p>
							Sorry about that! There was an error processing your request.
							<br className="hidden sm:block" /> If this issue persists, please{" "}
							<InlineLink className="text-white-10 underline" href={urls.resources.contact}>
								contact us
							</InlineLink>{" "}
							or check back later.
							<br className="hidden sm:block" /> Thank you for your patience &lt;3
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button className="w-fit" kind="secondary" size="sm" onClick={reset}>
						Try again
					</Button>
					<Button className="w-fit" kind="secondary" size="sm" onClick={() => router.back()}>
						Go back
					</Button>
				</div>
				<div className="flex flex-col">
					<div>
						<InlineLink highlight={false} href={urls.resources.networkStatus}>
							Network Status
						</InlineLink>
						{" • "}
						<InlineLink highlight={false} href={urls.socials.discord}>
							Discord
						</InlineLink>
						{" • "}
						<InlineLink highlight={false} href={urls.socials.twitter}>
							Twitter
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
