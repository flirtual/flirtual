"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { ArrowLeft, ArrowLeftToLine, ArrowRight, Cone, Dices, Ellipsis, Flame, Gamepad2, Sprout } from "lucide-react";
import {
	type ComponentProps,
	type DispatchWithoutAction,
	type FC,
	use,
	useRef,
	useState
} from "react";
import { useInView } from "react-intersection-observer";
import { capitalize, uniqueBy } from "remeda";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import type { World, WorldCategory } from "~/api/vrchat";
import { VRChat, worldCategories } from "~/api/vrchat";
import { Button } from "~/components/button";
import {
	DialogBody,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { Image } from "~/components/image";
import { useInfiniteQuery } from "~/query";
import { urls } from "~/urls";

const worldCategoryIcons = {
	recommended: Flame,
	spotlight: Cone,
	active: Flame,
	games: Gamepad2,
	new: Sprout,
	random: Dices,
} satisfies Record<WorldCategory, FC>;

const WorldItem: FC<{ world: World; onInvite?: DispatchWithoutAction }> = ({ world, onInvite }) => {
	return (
		<div className="flex w-40 shrink-0 snap-start snap-always flex-col rounded-xl border bg-white-10 desktop:w-56">
			<Image
				src={urls.arbitraryImage(world.thumbnailImageUrl, {
					fit: "cover",
					quality: 90,
					"slow-connection-quality": 50,
					width: 256,
					height: 192,
				})}
				alt={world.name}
				className="aspect-[256/192] rounded-xl rounded-b-none object-cover"
				height={192}
				width={256}
			/>
			<div className="flex flex-col gap-2 p-2 desktop:p-4">
				<div className="flex flex-col">
					<span className="truncate font-semibold">{world.name}</span>
					<span className="truncate text-sm opacity-75">
						by
						{" "}
						{world.authorName}
					</span>
				</div>
				<div className="flex items-center gap-2">
					{onInvite && (
						<Button className="h-6 grow" onClick={onInvite}>
							Invite
						</Button>
					)}
					<Button
						className="aspect-square h-6 shrink-0 p-0"
						Icon={Ellipsis}
						kind="tertiary"
					/>
				</div>
			</div>

		</div>
	);
};

const WorldItemSkeleton: FC<ComponentProps<"div">> = ({ className, ...props }) => {
	return (
		<div {...props} className={twMerge("flex w-40 shrink-0 snap-start snap-always flex-col rounded-xl border bg-white-10 desktop:w-56", className)}>
			<div className="aspect-[256/192] animate-pulse rounded-xl rounded-b-none bg-gray-200" />
			<div className="flex flex-col gap-3 p-2 desktop:p-4">
				<div className="flex flex-col gap-1">
					<span className="h-5 w-full animate-pulse rounded-sm bg-gray-200" />
					<span className="h-4 w-3/4 animate-pulse rounded-sm bg-gray-200 opacity-75" />
				</div>
				<div className="flex items-center gap-2">
					<span className="h-6 grow animate-pulse rounded-xl bg-gray-200" />
					<span className="size-6 shrink-0 animate-pulse rounded-full bg-gray-200" />
				</div>
			</div>
		</div>
	);
};

const WorldCategory: FC<{ category: WorldCategory }> = ({ category }) => {
	const { promise, fetchNextPage, } = useInfiniteQuery({
		queryKey: ["vrchat", "worlds", category],
		queryFn: ({ pageParam: page }) => VRChat.getWorldsByCategory(category, page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParameter) => {
			return lastPageParameter + 1;
		},
	});

	const reference = useRef<HTMLDivElement>(null);
	const scrollContainer = useRef<HTMLDivElement>(null);

	const [scrollLeft, setScrollLeft] = useState(0);

	const Icon = worldCategoryIcons[category];

	return (
		<div className="flex w-full snap-start snap-always flex-col gap-4" ref={reference}>
			<div className="flex items-center justify-between gap-2 px-4">
				<button
					className="flex items-center gap-2"
					type="button"
					onClick={() => reference?.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
				>
					<Icon className="inline-block size-5" />
					<span className="font-bold">
						{" "}
						{capitalize(category)}
					</span>
				</button>
				<div className="flex items-center gap-2">
					<Button
						className="aspect-square h-6 shrink-0 p-0 opacity-75 disabled:opacity-0 hocus:opacity-100"
						disabled={scrollLeft <= 256}
						Icon={ArrowLeftToLine}
						kind="tertiary"
						onClick={() => scrollContainer.current?.scrollTo({ left: 0, behavior: "smooth" })}
					/>
					<Button
						className="aspect-square h-6 shrink-0 p-0 opacity-75 hocus:opacity-100"
						Icon={ArrowLeft}
						kind="tertiary"
						onClick={() => scrollContainer.current?.scrollBy({
							left: -256,
							behavior: "smooth",
						})}
					/>
					<Button
						className="aspect-square h-6 shrink-0 p-0 opacity-75 hocus:opacity-100"
						Icon={ArrowRight}
						kind="tertiary"
						onClick={() => scrollContainer.current?.scrollBy({
							left: 256,
							behavior: "smooth",
						})}
					/>
				</div>
			</div>
			<div
				className="flex w-full snap-x snap-proximity scroll-px-4 gap-2 overflow-x-auto overflow-y-visible scroll-smooth px-4 desktop:gap-4"
				ref={scrollContainer}
				onScroll={({ currentTarget: { scrollLeft } }) => setScrollLeft(scrollLeft)}
			>
				<WorldCategoryContent
					promise={promise}
					onEndVisible={() => fetchNextPage()}
				/>
			</div>
		</div>
	);
};

const WorldCategoryContent = withSuspense<{
	promise: Promise<InfiniteData<Array<World>, unknown>>;
	onEndVisible?: DispatchWithoutAction;
}>(({ promise, onEndVisible }) => {
	const data = use(promise);

	const [loadMoreReference] = useInView({
		onChange: (inView) => {
			if (!inView) return;
			onEndVisible?.();
		},
	});

	// We might receive duplicate worlds across pages, so we need to deduplicate them.
	const worlds = uniqueBy(data?.pages.flat() ?? [], (world) => world.id);

	return (
		<>
			{worlds.map((world) => (
				<WorldItem
					key={world.id}
					world={world}
					onInvite={() => {

					}}
				/>
			))}
			<WorldItemSkeleton ref={loadMoreReference} />
		</>
	);
}, {
	fallback:
	<>
		{Array.from({ length: 10 }).map((_, index) => (
			// eslint-disable-next-line react/no-array-index-key
			<WorldItemSkeleton key={index} />
		))}
	</>
});

export default function Test() {
	return (
		<DrawerOrDialog open className="desktop:max-w-2xl">
			<>
				<DialogHeader>
					<DialogTitle>
						Invite to VRChat
					</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody className="-mx-4 overflow-y-auto">
					<div data-vaul-no-drag className="flex w-full snap-y snap-proximity flex-col gap-4">
						{worldCategories.map((category) => (
							<WorldCategory category={category} key={category} />
						))}
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
}
