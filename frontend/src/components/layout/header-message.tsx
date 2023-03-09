"use client";

import { ArrowLongRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";

import { useLocalStorage } from "~/hooks/use-local-storage";

export const HeaderMessage: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => {
	const [dismissMobile, setDismissMobile] = useLocalStorage("dismissMobile", false);
	if (dismissMobile) return null;

	return (
		<div
			{...props}
			className={twMerge("flex w-full justify-center bg-black-70 text-white-20", props.className)}
		>
			<div className="relative flex w-full max-w-screen-lg items-center justify-center px-8 py-4">
				<div className="relative flex gap-4 font-montserrat leading-none sm:text-lg">
					<ArrowLongRightIcon className="w-6 animate-bounce-x" />
					<span>{children}</span>
				</div>
				<button className="absolute right-8" type="button" onClick={() => setDismissMobile(true)}>
					<XMarkIcon className="w-6" strokeWidth={2} />
				</button>
			</div>
		</div>
	);
};
