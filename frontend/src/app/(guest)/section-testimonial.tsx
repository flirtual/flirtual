import { UCImage } from "~/components/uc-image";

import { SnapSection } from "./snap-section";

export interface SectionTestimonialProps {
	images: Array<string>;
	brands: Array<string>;
}

export const SectionTestimonial: React.FC<SectionTestimonialProps> = ({ images, brands }) => {
	return (
		<SnapSection
			className="grid h-screen grid-rows-[max-content,1fr,max-content] bg-brand-gradient"
			id="testimonial"
		>
			<div className="flex items-center justify-center p-8 md:p-16">
				<span className="font-montserrat text-3xl font-extrabold md:text-5xl">
					Thousands of matches (and memories) made.
				</span>
			</div>
			<div className="flex overflow-x-hidden">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="flex animate-scroll-x-screen">
						{images.map((src) => (
							<UCImage className="h-full object-cover" key={src} src={src} />
						))}
					</div>
					<div className="flex animate-scroll-x-screen">
						{images.map((src) => (
							<UCImage className="h-full object-cover" key={src} src={src} />
						))}
					</div>
				</div>
			</div>
			<div className="m-8 flex flex-wrap items-center justify-evenly gap-8 md:m-16 md:flex-nowrap">
				{brands.map((src) => (
					<UCImage className="w-24 md:w-full" key={src} src={src} />
				))}
			</div>
		</SnapSection>
	);
};
