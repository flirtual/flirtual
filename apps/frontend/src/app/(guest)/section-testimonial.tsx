/* eslint-disable @next/next/no-img-element */
import { urls } from "~/urls";
import { api } from "~/api";

import { SnapSection } from "./snap-section";

export interface SectionTestimonialProps {
	images: Array<string>;
	brands: Array<string>;
}

export const SectionTestimonial: React.FC<SectionTestimonialProps> = async ({
	images,
	brands
}) => {
	const totalUsers = await api.user.count();

	return (
		<SnapSection
			className="grid h-screen grid-rows-[max-content,1fr,max-content] bg-brand-gradient"
			id="testimonial"
		>
			<div className="flex items-center justify-center p-8 md:p-16">
				<span className="font-montserrat text-3xl font-extrabold md:text-5xl">
					Match with {(Math.floor(totalUsers / 5000) * 5000).toLocaleString()}+
					users from all over the world!
				</span>
			</div>
			<div className="flex overflow-x-hidden">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="flex animate-scroll-x-screen">
						{images.map((source) => (
							<img
								className="h-full object-cover"
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
					<div className="flex animate-scroll-x-screen">
						{images.map((source) => (
							<img
								className="h-full object-cover"
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
				</div>
			</div>
			<div className="m-8 flex flex-wrap items-center justify-evenly gap-8 md:m-16 md:flex-nowrap">
				{brands.map((source) => (
					<img
						className="w-24 md:w-full"
						key={source}
						src={urls.media(source)}
					/>
				))}
			</div>
		</SnapSection>
	);
};
