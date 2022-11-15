import { UCImage } from "~/components/uc-image";

import { SnapSection } from "./snap-section";

export interface SectionTestimonialProps {
	images: Array<string>;
	brands: Array<string>;
}

export const SectionTestimonial: React.FC<SectionTestimonialProps> = ({ images, brands }) => {
	return (
		<SnapSection
			className="h-screen bg-brand-gradient grid grid-rows-[max-content,1fr,max-content]"
			id="testimonial"
		>
			<div className="flex items-center justify-center p-8 md:p-16">
				<span className="font-montserrat font-extrabold text-3xl md:text-5xl">
					Thousands of matches (and memories) made.
				</span>
			</div>
			<div className="flex overflow-x-hidden">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="animate-scroll-x-screen flex">
						{images.map((src) => (
							<UCImage className="h-full object-cover" key={src} src={src} />
						))}
					</div>
					<div className="animate-scroll-x-screen flex">
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
