import { unstable_cache } from "next/cache";
import { Suspense } from "react";

import { urls } from "~/urls";
import { api } from "~/api";

import { SnapSection } from "./snap-section";
import { UserTotal } from "./user-total";

export interface SectionTestimonialProps {
	images: Array<string>;
	brands: Array<string>;
}

export const SectionTestimonial: React.FC<SectionTestimonialProps> = async ({
	images,
	brands
}) => {
	const totalUsersPromise = unstable_cache(
		() => {
			return api.user.count();
		},
		["totalUsers"],
		{ revalidate: 86400 }
	)();

	return (
		<SnapSection
			className="grid h-screen grid-rows-[max-content,1fr,max-content] bg-brand-gradient"
			id="testimonial"
		>
			<div className="flex items-center justify-center p-8 desktop:p-16">
				<span className="font-montserrat text-3xl font-extrabold desktop:text-5xl">
					Match with{" "}
					<Suspense fallback="0">
						<UserTotal promise={totalUsersPromise} />
					</Suspense>
					+ users from all over the world!
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
			<div className="m-8 flex flex-wrap items-center justify-evenly gap-8 desktop:m-16 desktop:flex-nowrap">
				{brands.map((source) => (
					<img
						className="w-24 desktop:w-full"
						key={source}
						src={urls.media(source)}
					/>
				))}
			</div>
		</SnapSection>
	);
};
