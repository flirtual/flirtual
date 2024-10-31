"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";
import { Button } from "~/components/button";

import type Error from "next/error";

export default function GlobalError({
	error,
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html>
			<body>
				<div className="flex min-h-screen w-full justify-center bg-black-80 px-8 py-16 text-white-20 desktop:items-center">
					<div className="flex flex-col gap-8 desktop:justify-start">
						<div className="flex flex-col gap-8">
							<FlirtualLogo className="w-64" />
							<h1 className="font-montserrat text-2xl font-semibold desktop:text-3xl">
								<span className="line-through">Scheduled</span> maintenance
							</h1>
							<div className="flex flex-col gap-4 font-nunito">
								<p>
									We&apos;re currently performing <span className="line-through">scheduled</span> maintenance.
									<br className="hidden desktop:block" />
									Apologies for the interruption, we&apos;ll be back shortly!
									<br className="hidden desktop:block" /> If this issue
									persists, please{" "}
									<Link
										className="text-white-10 underline"
										href={urls.resources.contact}
									>
										contact us
									</Link>{" "}
									or check back later.
									<br className="hidden desktop:block" /> Thank you for your
									patience &lt;3
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								className="w-fit"
								kind="secondary"
								size="sm"
								onClick={() => location.reload()}
							>
								Refresh
							</Button>
							<Button
								className="w-fit"
								kind="secondary"
								size="sm"
								onClick={() => history.back()}
							>
								Go back
							</Button>
						</div>
						<div className="mt-auto flex flex-col">
							<div>
								<Link className="underline" href={urls.resources.networkStatus}>
									Network Status
								</Link>
								{" • "}
								<Link className="underline" href={urls.socials.discord}>
									Discord
								</Link>
								{" • "}
								<Link className="underline" href={urls.socials.twitter}>
									Twitter
								</Link>
							</div>
							<footer>© {new Date().getFullYear()} Flirtual</footer>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
