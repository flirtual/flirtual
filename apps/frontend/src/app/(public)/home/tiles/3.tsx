import { useInView } from "react-intersection-observer";

import { urls } from "~/urls";

import { SnapSection } from "../snap-section";

import type { TileProps } from "../page";

export interface SectionTestimonialProps extends TileProps {
	images: Array<string>;
	brands: Array<string>;
}

const brands = [
	"dc248f6f-aee6-4318-b473-6fe2d6db07ee",
	"d34ee25e-31e6-47a7-952f-51820f1e1ce1",
	"257a7f46-a6c1-4bee-9a3e-5dbdfe9d2a66",
	"18e4a7ad-625a-42f6-b581-d14386ced012",
	"29a2f1bc-0b3e-469a-aa11-0de69b75b629",
	"db2eb424-e837-4d64-85e0-e49409ae33a6",
	"54ffe640-1c54-4d8f-a754-4c7b7ca82456",
	"b779aa38-8592-48cd-8f9b-88228c5abc21",
	"7845a7d0-0461-41dd-934c-cb8439e90dc7",
	"fd92ab0f-d264-4a69-813f-bea13def2c46"
];

const images = [
	"a68e9441-8430-4a33-a067-04313d4d260c",
	"5e0d4116-2e60-4ae9-b865-3ce7d17c68ec",
	"01db5707-2aac-45cd-a80c-223c6e1b93f2",
	"b8ea7c5b-5110-46b7-8635-38728e8a77aa",
	"eea60bde-de1a-4f43-9f02-a218fddf2a73",
	"ad5cba2d-03ff-43eb-9cf3-e6986bb0be54",
	"40122187-d831-4131-ab8e-ee0f5544ce73",
	"17b87f45-0ef8-4dfa-80c4-c23450f09b30",
	"28eaf327-e2bd-4fd2-a7f9-4dd6be153bfc",
	"5bbf00fc-2c97-49b2-9f16-9d3c1a180ae8",
	"f3b27da8-4f36-4c7f-bd65-094421d28f22",
	"c0d8ad7f-a6df-4de8-a429-a8fa729bf447",
	"9f2de017-6b5a-4ca9-b858-95057889fd64",
	"b8b087b9-3ab3-4a05-b01a-166b502789f5"
];

export const Testimonial: React.FC<TileProps> = ({ id, onVisible }) => {
	const [ref] = useInView({ onChange: (inView) => inView && onVisible() });

	/* const totalUsersPromise = unstable_cache(
		() => {
			return api.user.count();
		},
		["totalUsers"],
		{ revalidate: 86400 }
	)(); */

	return (
		<SnapSection className="flex flex-col" id="testimonial" data-tile={id}>
			<div className="flex justify-center p-8 desktop:p-16">
				<span
					ref={ref}
					className="font-montserrat text-3xl font-extrabold desktop:text-5xl"
				>
					Match with 90,000+ people from all over the world!
				</span>
			</div>
			<div className="flex h-[40vh] shrink-0 overflow-x-hidden desktop:h-[50vh]">
				<div className="grid min-w-max grid-cols-2 overflow-y-hidden">
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:h-[50vh]">
						{images.map((source) => (
							<img
								className="h-full object-cover"
								key={source}
								src={urls.media(source)}
							/>
						))}
					</div>
					<div className="flex h-[40vh] animate-scroll-x-screen desktop:h-[50vh]">
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
			<div className="relative mx-auto flex max-h-full max-w-screen-wide flex-wrap items-center justify-around gap-8 p-8 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black-80 desktop:h-full desktop:p-16 desktop:before:bg-none">
				{brands.map((source) => (
					<img
						key={source}
						className="h-fit w-20 desktop:w-32"
						src={urls.media(source)}
					/>
				))}
			</div>
		</SnapSection>
	);
};
