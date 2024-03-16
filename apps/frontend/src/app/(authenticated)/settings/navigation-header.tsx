import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ensureRelativeUrl, urls } from "~/urls";

export interface NavigationHeaderProps {
	navigationInner: string | null;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
	navigationInner
}) => {
	const query = useSearchParams();

	const Icon = navigationInner ? ChevronLeft : X;
	const returnTo = ensureRelativeUrl(
		query.get("return") ??
			(navigationInner ? urls.settings.list() : urls.browse())
	);

	return (
		<div className="fixed z-10 flex w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(env(safe-area-inset-top)+0.5rem),1rem)] text-white-20 sm:pt-4 md:static md:rounded-tr-2xl md:bg-brand-gradient">
			<Link
				className="absolute left-4 flex shrink-0 vision:left-8 md:hidden"
				href={returnTo}
			>
				<Icon className="w-6" />
			</Link>
			<span className="font-montserrat text-xl font-semibold">Settings</span>
		</div>
	);
};
