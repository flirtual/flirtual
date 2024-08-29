"use client";

import { ButtonLink } from "~/components/button";
import { urls } from "~/urls";

import type { FC } from "react";

export const TileGuide: FC<{ tile: number; tileCount: number }> = ({
	tile,
	tileCount
}) => {
	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex h-36 flex-col items-center justify-center gap-4 px-8 pb-16 desktop:inset-y-0 desktop:left-0 desktop:right-auto desktop:h-auto desktop:px-16 desktop:py-8">
			<div className="pointer-events-auto grid w-full grid-cols-2 gap-2 desktop:hidden">
				<ButtonLink href={urls.register} size="sm">
					Sign up
				</ButtonLink>
				<ButtonLink href={urls.register} size="sm" kind="secondary">
					Log in
				</ButtonLink>
			</div>
			<div className="pointer-events-auto flex items-center justify-center gap-4 p-2 desktop:flex-col">
				{Array.from({ length: tileCount }).map((_, index) => (
					<button
						key={index}
						type="button"
						onClick={() =>
							document
								.querySelector(`[data-tile="${index}"]`)
								?.scrollIntoView({ behavior: "smooth" })
						}
						data-active={index === tile ? "" : undefined}
						className="group flex size-5 items-center justify-center"
					>
						<div className="size-2 rounded-full bg-white-10 shadow-md transition-all group-hover:size-3 group-data-[active]:size-4 " />
					</button>
				))}
			</div>
		</div>
	);
};
