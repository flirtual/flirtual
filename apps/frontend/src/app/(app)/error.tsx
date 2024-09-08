"use client";

import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

import { Button } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { ModelCard } from "~/components/model-card";
import { environment } from "~/const";

import { DebugInfo } from "./(public)/debugger/debug-info";

export default function Error({
	error,
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const router = useRouter();
	const [showMore, setShowMore] = useState(environment === "development");
	useEffect(() => void Sentry.captureException(error), [error]);

	return (
		<ModelCard
			branded
			className="desktop:max-w-2xl"
			title="Something went wrong!"
			titleProps={{ className: "text-2xl" }}
			containerProps={{ className: "flex flex-col gap-8" }}
		>
			<div className="relative flex flex-col gap-8 desktop:flex-row">
				<Image
					className="pettable h-16 w-fit shrink-0 rotate-[10deg]"
					src={
						"https://cdn.discordapp.com/emojis/1115456900167893003.webp?size=128&quality=lossless"
					}
					alt=""
					width={128}
					height={107}
				/>

				<div className="relative flex flex-col gap-2 rounded-lg bg-white-10 p-4 text-black-80">
					<div
						className="absolute -top-5 left-9 size-5 rotate-90 bg-white-10 desktop:-left-5 desktop:top-7 desktop:rotate-0"
						style={{ clipPath: "polygon(100% 0, 0 60%, 100% 100%)" }}
					/>
					<p>
						Pawdon the interruption! I must've knocked the server over and got
						things tangled. I'm on the case with my trusty hardhat.
					</p>
					<p>Give us a moment to sort this out!</p>
					<p className="max-w-sm whitespace-pre-wrap font-mono text-xs">
						{error.digest && <>ID: {error.digest} </>}
						<button
							type="button"
							className="opacity-75 hover:opacity-100"
							onClick={() => setShowMore((showMore) => !showMore)}
						>
							(show {showMore ? "less" : "more"})
						</button>
					</p>
				</div>
			</div>
			{showMore && (
				<div className="flex flex-col gap-4">
					<span className="whitespace-pre-wrap break-all font-mono text-xs">
						{error.message}
					</span>
					<DebugInfo />
				</div>
			)}
			<div className="flex gap-2">
				<Button className="w-fit" size="sm" onClick={reset}>
					Try again
				</Button>
				<Button
					className="w-fit"
					kind="secondary"
					size="sm"
					onClick={() => router.back()}
				>
					Go back
				</Button>
			</div>
			<div className="mt-auto flex flex-col">
				<div className="flex gap-2">
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
				<footer>© {new Date().getFullYear()} Flirtual</footer>
			</div>
		</ModelCard>
	);
}
