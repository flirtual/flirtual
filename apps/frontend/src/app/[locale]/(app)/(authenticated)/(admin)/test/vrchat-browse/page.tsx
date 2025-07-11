"use client";

import { Cone, Dices, Flame, Gamepad2, Sprout } from "lucide-react";
import type { ComponentProps, Dispatch, DispatchWithoutAction, FC, JSX } from "react";
import { useInView } from "react-intersection-observer";
import { capitalize, uniqueBy } from "remeda";
import { twMerge } from "tailwind-merge";

import type { World, WorldCategory } from "~/api/vrchat";
import { VRChat, worldCategories } from "~/api/vrchat";
import { Button } from "~/components/button";
import { DialogBody, DialogDescription, DialogHeader, DialogTitle } from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { Image } from "~/components/image";
import { useInfiniteQuery } from "~/query";

const worldCategoryIcons = {
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
				alt={world.name}
				className="aspect-[256/192] rounded-xl rounded-b-none object-cover"
				height={192}
				src={world.thumbnailImageUrl}
				width={256}
			/>
			<div className="flex flex-col gap-2 p-2 desktop:p-4">
				<div className="flex flex-col">
					<span className="truncate font-semibold">{world.name}</span>
					<span className="truncate opacity-75">
						by
						{" "}
						{world.authorName}
					</span>
				</div>
				{onInvite && (
					<Button className="h-fit py-1" onClick={onInvite}>
						Invite
					</Button>
				)}
			</div>

		</div>
	);
};

const WorldItemSkeleton: FC<ComponentProps<"div">> = ({ className, ...props }) => {
	return (
		<div {...props} className={twMerge("flex w-56 shrink-0 snap-start snap-always flex-col gap-2 rounded-xl border bg-white-10 p-4", className)}>
			<div className="aspect-[256/192] animate-pulse rounded-lg bg-gray-200" />
			<div className="flex flex-col gap-0.5">
				<span className="h-4 w-full animate-pulse rounded-sm bg-gray-200" />
				<span className="h-4 w-3/4 animate-pulse rounded-sm bg-gray-200 opacity-75" />
			</div>
		</div>
	);
};

const WorldCategoryList: FC<{ category: WorldCategory }> = ({ category }) => {
	const { data, isFetching, fetchNextPage } = useInfiniteQuery({
		queryKey: ["vrchat", "worlds", category],
		queryFn: ({ pageParam: page }) => VRChat.getWorldsByCategory(category, page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParameter) => {
			return lastPageParameter + 1;
		},
	});

	const Icon = worldCategoryIcons[category];

	const [loadMoreReference] = useInView({
		onChange: (inView) => {
			console.log({ category, inView, isFetching });
			if (!inView || isFetching) return;
			fetchNextPage();
		},
	});

	// We might receive duplicate worlds across pages, so we need to deduplicate them.
	const worlds = uniqueBy(data?.pages.flat() ?? [], (world) => world.id);

	return (
		<div className="flex w-full flex-col gap-4">
			<h2 className="flex items-center gap-2 font-bold">
				<Icon className="inline-block size-5" />
				{" "}
				{capitalize(category)}
			</h2>
			<div className="flex w-full snap-x snap-proximity gap-2 overflow-x-auto overflow-y-visible scroll-smooth desktop:gap-4">
				{worlds.map((world) => (
					<WorldItem key={world.id} world={world} />
				))}
				<WorldItemSkeleton ref={loadMoreReference} />
			</div>
		</div>
	);
};

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
				<DialogBody>
					<div data-vaul-no-drag className="flex w-full flex-col gap-4">
						{worldCategories.map((category) => (
							<WorldCategoryList category={category} key={category} />
						))}
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
}
