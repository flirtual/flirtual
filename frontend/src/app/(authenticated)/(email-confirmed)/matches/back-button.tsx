"use client";

import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { urls } from "~/urls";

export const BackButton: React.FC = () => {
	const layoutSegment = useSelectedLayoutSegment();
	const HeaderIcon = layoutSegment ? ChevronLeftIcon : XMarkIcon;

	return (
		<Link
			className="absolute left-4 flex shrink-0 md:hidden"
			href={layoutSegment ? urls.conversations.list : urls.browse()}
		>
			<HeaderIcon className="w-6" />
		</Link>
	);
};
