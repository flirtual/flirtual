import { twMerge } from "tailwind-merge";

export interface ImageListItemProps {
	name: string;
	dark?: boolean;
	sources: Record<string, string>;
}

function ImageListItem({ name, sources, dark }: ImageListItemProps) {
	const defaultKind = Object.keys(sources)[0];

	return (
		<div className="flex flex-col gap-2">
			<a
				style={{
					background: dark
						? "repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 50% / 30px 30px"
						: "repeating-conic-gradient(#fff 0% 25%, #eee 0% 50%) 50% / 30px 30px"
				}}
				className="flex h-full items-center justify-center overflow-hidden rounded-lg"
				download={`flirtual-${name}.${defaultKind}`}
				href={sources[defaultKind]}
			>
				<img className="w-full object-contain" src={sources[defaultKind]} />
			</a>
			<div className="flex gap-2">
				{Object.entries(sources).map(([kind, source]) => (
					<a
						key={kind}
						className="uppercase text-theme-2 hocus:underline hocus:outline-none"
						download={`flirtual-${name}.${kind}`}
						href={source}
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

export function ImageList({ className, items }: ImageListProps) {
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
