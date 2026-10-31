import { useTranslation } from "react-i18next";

export const NavigationHeader: React.FC = () => {
	const { t } = useTranslation();

	return (
		<div data-dark-backdrop className="sticky top-0 full-bleed-x flex min-h-(--status-bar-height,0rem) w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(var(--status-bar-inset-top,var(--safe-area-inset-top,0rem))+0.5rem),1rem)] pr-[calc(1rem+var(--top-clearance-right,0rem))] pl-[calc(1rem+var(--top-clearance-left,0rem))] text-white-20 split:shrink-0 split:border-r split:border-r-black-70 desktop:static desktop:border-r-0 desktop:bg-transparent desktop:px-4 desktop:pt-4.5 desktop:pb-4">
			<span className="font-montserrat text-2xl font-extrabold">{t("settings")}</span>
		</div>
	);
};
