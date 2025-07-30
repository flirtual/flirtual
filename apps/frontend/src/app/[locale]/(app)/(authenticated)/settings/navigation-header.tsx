import { ChevronLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { Link } from "~/components/link";
import { ensureRelativeUrl, urls } from "~/urls";

export interface NavigationHeaderProps {
	navigationInner: string | null;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
	navigationInner
}) => {
	const [query] = useSearchParams();
	const { t } = useTranslation();

	const Icon = navigationInner ? ChevronLeft : X;
	const returnTo = ensureRelativeUrl(
		query.get("return")
		?? (navigationInner ? urls.settings.list() : urls.discover("dates"))
	);

	return (
		<div className="sticky top-0 flex w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(var(--safe-area-inset-top,0rem)+0.5rem),1rem)] text-white-20 desktop:static desktop:bg-transparent desktop:pb-4 desktop:pt-[1.125rem]">
			<Link
				className="absolute left-4 flex shrink-0 vision:left-8 desktop:hidden"
				href={returnTo}
			>
				<Icon className="w-6" />
			</Link>
			<span className="font-montserrat text-2xl font-extrabold">{t("settings")}</span>
		</div>
	);
};
