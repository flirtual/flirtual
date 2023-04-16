import { twMerge } from "tailwind-merge";

export interface ImageListItemProps {
	name: string;
	dark?: boolean;
	kinds: Array<string>;
}

function getFilename(name: string, kind: string) {
	console.log(name, kind);
	return `flirtual-${name.replaceAll(/\//g, "-")}.${kind}`;
}

async function getFile(name: string, kind: string) {
	return (await import(`~/../public/images/brand/${name}.${kind}`)).default;
}

async function ImageListItem(item: ImageListItemProps) {
	const defaultKind = item.kinds[0];
	const data = await getFile(item.name, defaultKind);

	const kinds = await Promise.all(
		item.kinds.map(async (kind) => ({
			kind,
			data: await getFile(item.name, kind)
		}))
	);

	return (
		<div className="flex flex-col gap-2">
			<a
				className="flex h-full items-center justify-center overflow-hidden rounded-lg"
				download={getFilename(item.name, defaultKind)}
				href={data.src}
				style={{
					background: item.dark
						? "repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 50% / 30px 30px"
						: "repeating-conic-gradient(#fff 0% 25%, #eee 0% 50%) 50% / 30px 30px"
				}}
			>
				<img className="h-fit w-full" src={data.src} />
			</a>
			<div className="flex gap-2">
				{kinds.map(({ kind, data }) => (
					<a
						className="uppercase text-pink hocus:underline hocus:outline-none"
						download={getFilename(item.name, kind)}
						href={data.src}
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
		<div className={twMerge("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
			{items.map((item) => {
				/* @ts-expect-error: Server Component */
				return <ImageListItem key={item.name} {...item} />;
			})}
		</div>
	);
}
