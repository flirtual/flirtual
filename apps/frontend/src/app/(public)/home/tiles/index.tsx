"use client";

import { Slot } from "@radix-ui/react-slot";
import { useTranslations } from "next-intl";
import type {
	FC,
	PropsWithChildren,
	RefAttributes
} from "react";
import {
	createContext,
	use,
	useMemo,
	useState
} from "react";
import { useInView } from "react-intersection-observer";
import { twMerge } from "tailwind-merge";

import { ButtonLink } from "~/components/button";
import { urls } from "~/urls";

export interface TileProps {
	id: number;
}

const TileContext = createContext(
	{} as { tile: number; setTile: (tile: number) => void }
);

export const TileProvider: FC<PropsWithChildren> = ({ children }) => {
	const [tile, setTile] = useState(0);

	return (
		<TileContext
			value={useMemo(() => ({ tile, setTile }), [tile, setTile])}
		>
			{children}
		</TileContext>
	);
};

export function Tile({ className, children, id, ...props }: Omit<React.ComponentProps<"section">, "id"> & RefAttributes<HTMLElement> & TileProps) {
	const { tile } = use(TileContext);

	return (
		<section
			{...props}
			className={twMerge(
				"group h-screen min-h-screen w-screen min-w-[100vw] snap-start snap-always pb-[env(safe-area-inset-bottom,0rem)] pl-[env(safe-area-inset-left,0rem)] pr-[env(safe-area-inset-right,0rem)] pt-[env(safe-area-inset-top,0rem)] android:pt-[var(--safe-area-inset-top,0rem)]",
				className
			)}
			data-tile={id}
			data-tile-active={tile === id ? "" : undefined}
		>
			{children}
		</section>
	);
}

export const TileAnchor: FC<PropsWithChildren<TileProps>> = ({
	id,
	children
}) => {
	const { setTile } = use(TileContext);
	const [reference] = useInView({
		onChange: (inView) => inView && setTile(id)
	});

	return <Slot ref={reference}>{children}</Slot>;
};

export const TileGuide: FC<{ tileCount: number }> = ({ tileCount }) => {
	const { tile } = use(TileContext);
	const t = useTranslations("landing");

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex h-36 flex-col items-center justify-center gap-4 px-8 pb-16 desktop:inset-y-0 desktop:left-0 desktop:right-auto desktop:h-auto desktop:px-16 desktop:py-8">
			<div className="pointer-events-auto grid w-full grid-cols-2 gap-2 desktop:hidden">
				<ButtonLink href={urls.register} size="sm">
					{t("sign_up")}
				</ButtonLink>
				<ButtonLink href={urls.login()} kind="secondary" size="sm">
					{t("log_in")}
				</ButtonLink>
			</div>
			<div className="pointer-events-auto flex items-center justify-center gap-4 p-2 desktop:flex-col">
				{Array.from({ length: tileCount }).map((_, index) => (
					<button
						className="group flex size-5 items-center justify-center"
						data-active={index === tile ? "" : undefined}
						// eslint-disable-next-line react/no-array-index-key
						key={index}
						type="button"
						onClick={() =>
							document
								.querySelector(`[data-tile="${index}"]`)
								?.scrollIntoView({ behavior: "smooth" })}
					>
						<div className="size-2 rounded-full bg-white-10 shadow-md transition-all group-hover:size-3 group-data-[active]:size-4 " />
					</button>
				))}
			</div>
		</div>
	);
};
