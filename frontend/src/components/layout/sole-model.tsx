import React from "react";
import { twMerge } from "tailwind-merge";

import { Footer } from "./footer";
import { Navigation } from "./navigation";

export const SoleModelLayout: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => (
	<div
		{...props}
		className={twMerge(
			"bg-brand-cream flex min-h-screen grow flex-col-reverse sm:flex-col overflow-x-hidden text-black",
			props.className
		)}
	>
		<Navigation />
		<div className="flex flex-col grow items-center justify-center md:p-32">{children}</div>
		{/* <div className="flex sm:hidden h-16">
			<div className="flex py-3 gap-4 fixed h-16 top-0 w-full bg-brand-gradient text-brand-white font-nunito p-8">
				<img
					className="rounded-full aspect-square h-full"
					src={
						"https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/"
					}
				/>
				<img
					className="rounded-full aspect-square h-full"
					src={
						"https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/"
					}
				/>
				<img
					className="rounded-full aspect-square h-full"
					src={
						"https://media.flirtu.al/b8a05ec5-7aea-4e33-bb2b-46301eaddd9a/-/scale_crop/64x64/smart_faces_points/-/format/auto/-/quality/smart/-/resize/x65/"
					}
				/>
			</div>
		</div> */}
		<Footer />
	</div>
);
