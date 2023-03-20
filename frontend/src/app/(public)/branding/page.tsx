import { twMerge } from "tailwind-merge";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { ButtonLink } from "~/components/button";

const Color: React.FC<{ name: string; value: string; invert?: boolean }> = ({
	name,
	value,
	invert
}) => (
	<div
		className={twMerge("grow rounded-lg border p-4", invert && "text-black-80")}
		style={{ background: value }}
	>
		<span className="text-lg font-semibold">{name}</span>
		<pre className="[white-space:break-spaces]">{value}</pre>
	</div>
);

export interface ImageListItemProps {
	name: string;
	dark?: boolean;
	kinds: Array<string>;
}

async function ImageListItem(item: ImageListItemProps) {
	const defaultKind = item.kinds[0];
	const data = (await import(`~/../public/images/brand/${item.name}.${defaultKind}`)).default;

	return (
		<div className="flex flex-col gap-2">
			<a
				className="flex h-full items-center justify-center overflow-hidden rounded-lg"
				download={`flirtual-${item.name}.${defaultKind}`}
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
				{item.kinds.map((kind) => (
					<a
						className="uppercase text-pink hocus:underline hocus:outline-none"
						download={`flirtual-${item.name}.${kind}`}
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

async function ImageList({ className, items }: ImageListProps) {
	return (
		<div className={twMerge("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
			{items.map((item) => {
				/* @ts-expect-error: Server Component */
				return <ImageListItem key={item.name} {...item} />;
			})}
		</div>
	);
}

export default async function BrandingPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full sm:max-w-xl"
				containerProps={{ className: "gap-8" }}
				title="Branding"
			>
				<p>
					Looking to use our art for something? Here it is. Please keep it tasteful and{" "}
					<InlineLink href="mailto:press@flirtu.al">contact us</InlineLink> for approval.
				</p>
				<div className="flex flex-col gap-4">
					<span className="text-2xl font-semibold">Our logo</span>
					<span>
						Please do not edit, change, distort, recolor, or reconfigure the Flirtual logo.
					</span>
					{/* @ts-expect-error: Server Component */}
					<ImageList
						items={[
							{
								name: "gradient",
								kinds: ["svg", "png"]
							},
							{
								name: "white",
								kinds: ["svg", "png"],
								dark: true
							},
							{
								name: "black",
								kinds: ["svg", "png"]
							}
						]}
					/>
				</div>
				<div className="flex flex-col gap-4">
					<span className="text-2xl font-semibold">Mark only</span>
					<span>
						Use these only when the Flirtual brand is clearly visible or has been well established
						elsewhere on the page or in the design.
					</span>
					{/* @ts-expect-error: Server Component */}
					<ImageList
						className="sm:grid-cols-4"
						items={[
							{
								name: "mark/gradient",
								kinds: ["svg", "png"]
							},
							{
								name: "mark/default",
								kinds: ["svg", "png"]
							},
							{
								name: "mark/white",
								kinds: ["svg", "png"],
								dark: true
							},
							{
								name: "mark/black",
								kinds: ["svg", "png"]
							}
						]}
					/>
				</div>
				<div className="flex flex-col gap-4">
					<span className="text-2xl font-semibold">Colors</span>
					<div className="flex flex-wrap gap-2 text-white-20">
						<Color name="Gradient" value="linear-gradient(to right, #FF8975, #E9658B)" />
						<Color name="Pink" value="#E9658B" />
						<Color invert name="White" value="#FFFAFA" />
						<Color name="Black" value="#131516" />
						<Color invert name="Grey" value="#E4E4E4" />
						<Color invert name="Cream" value="#FFFAF0" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<span className="text-2xl font-semibold">Need more?</span>
					<span>Download our full press kit for more graphics and information.</span>
					<ButtonLink download className="w-fit" href="/presskit.zip">
						Download
					</ButtonLink>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
