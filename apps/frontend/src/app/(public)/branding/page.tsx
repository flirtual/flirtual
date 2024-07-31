import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { ButtonLink } from "~/components/button";
import { urls } from "~/urls";

import { ImageList } from "./image-list";
import { ColorBlock } from "./color-block";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Branding"
};

export default async function BrandingPage() {
	return (
		<SoleModelLayout>
			<ModelCard
				className="w-full desktop:max-w-xl"
				containerProps={{ className: "gap-8" }}
				title="Branding"
			>
				<p>
					Looking to use our art for something? Here it is. Please keep it
					tasteful and{" "}
					<InlineLink href="mailto:press@flirtu.al">contact us</InlineLink> for
					approval.
				</p>
				<div className="flex flex-col gap-4">
					<span className="text-2xl font-semibold">Our logo</span>
					<span>
						Please do not edit, change, distort, recolor, or reconfigure the
						Flirtual logo.
					</span>
					<ImageList
						items={[
							{
								name: "background",
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
						Use these only when the Flirtual brand is clearly visible or has
						been well established elsewhere on the page or in the design.
					</span>
					<ImageList
						className="desktop:grid-cols-4"
						items={[
							{
								name: "mark/background",
								kinds: ["svg", "png"]
							},
							{
								name: "mark",
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
						<ColorBlock
							name="Gradient"
							value="linear-gradient(to right, #FF8975, #E9658B)"
						/>
						<ColorBlock
							name="Dark Mode"
							value="linear-gradient(to right, #B24592, #E9658B)"
						/>
						<ColorBlock
							name="Homie Mode"
							value="linear-gradient(to right, #82BF72, #4D8888)"
						/>
						<ColorBlock name="Pink" value="#E9658B" />
						<ColorBlock invert name="Cream" value="#FFFAF0" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<span className="text-2xl font-semibold">Need more?</span>
					<span>
						Download our full press kit for more graphics and information.
					</span>
					<ButtonLink
						download
						className="w-fit"
						href={urls.media("presskit.zip", "files")}
					>
						Download
					</ButtonLink>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
