import { Slot } from "@radix-ui/react-slot";

import { ShareIcon } from "~/components/icons/share";
import { FlirtualMark } from "~/components/mark";
// import { useShare } from "~/hooks/use-share";

export const ReferralTicket: React.FC<{ code: string }> = ({ code }) => {
	// const share = useShare();

	return (
		<div className="relative mx-8 my-2 rounded-3xl bg-white-10 bg-brand-gradient p-10 shadow-brand-1 dark:bg-black-60">
			<FlirtualMark className="absolute left-2 top-2 h-32" />
			<div className="absolute inset-y-4 left-40 border-l-2 border-dashed dark:border-black-60" />
			<div className="ml-40 flex flex-col gap-1">
				<div className="text-center font-montserrat text-4xl font-extrabold text-white-10">
					{code}
				</div>
				<Slot
					className="cursor-pointer hover:opacity-70"
					// onClick={async () => {
					// 	await share({
					// 		text: code
					// 	});
					// }}
				>
					<div className="flex justify-center gap-1.5 text-white-10">
						<ShareIcon className="mt-0.5 h-6" />
						<span className="font-montserrat text-lg font-semibold uppercase">
							Share
						</span>
					</div>
				</Slot>
			</div>
			<div className="absolute -top-4 left-36 size-8 rounded-full bg-white-20 dark:bg-black-70" />
			<div className="absolute -bottom-4 left-36 size-8 rounded-full bg-white-20 dark:bg-black-70" />
		</div>
	);
};
