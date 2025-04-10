/* eslint-disable @next/next/no-img-element */
import { twMerge } from "tailwind-merge";

import { urls } from "~/urls";

export interface ImageListItemProps {
	name: string;
	dark?: boolean;
	kinds: Array<string>;
}

function getUrl(name: string, kind: string) {
	return urls.media(`flirtual-${name.replaceAll("/", "-")}.${kind}`, "files");
}

async function ImageListItem({ name, kinds, dark }: ImageListItemProps) {
	const defaultKind = kinds[0];

	return (
		<div className="flex flex-col gap-2">
			<a
				style={{
					background: dark
						? "repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 50% / 30px 30px"
						: "repeating-conic-gradient(#fff 0% 25%, #eee 0% 50%) 50% / 30px 30px"
				}}
				className="flex h-full items-center justify-center overflow-hidden rounded-lg"
				href={getUrl(name, defaultKind!)}
			>
				<img className="h-fit w-full" src={getUrl(name, defaultKind!)} />
			</a>
			<div className="flex gap-2">
				{kinds.map((kind) => (
					<a
						className="uppercase text-theme-2 hocus:underline hocus:outline-none"
						href={getUrl(name, kind)}
						key={kind}
					>
						{kind}
					</a>
				))}
			</div>
		</div>
	);
}

export interface ImageListProps {
	items: Array<ImageListItemProps>;
	className?: string;
}

export async function ImageList({ className, items }: ImageListProps) {
	return (
		<div
			className={twMerge(
				"grid grid-cols-1 gap-4 desktop:grid-cols-3",
				className
			)}
		>
			{items.map((item) => (
				<ImageListItem key={item.name} {...item} />
			))}
		</div>
	);
}
