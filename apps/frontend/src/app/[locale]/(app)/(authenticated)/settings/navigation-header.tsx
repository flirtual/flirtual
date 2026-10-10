import { useTranslation } from "react-i18next";

export const NavigationHeader: React.FC = () => {
	const { t } = useTranslation();

	return (
		<div className="sticky top-0 flex min-h-[var(--status-bar-height,0rem)] w-full items-center justify-center bg-black-70 p-4 pl-[calc(1rem+var(--top-clearance-left,0rem))] pr-[calc(1rem+var(--top-clearance-right,0rem))] pt-[max(calc(var(--status-bar-inset-top,var(--safe-area-inset-top,0rem))+0.5rem),1rem)] text-white-20 full-bleed-x split:shrink-0 split:border-r split:border-r-black-70 desktop:static desktop:border-r-0 desktop:bg-transparent desktop:px-4 desktop:pb-4 desktop:pt-[1.125rem]">
			<span className="font-montserrat text-2xl font-extrabold">{t("settings")}</span>
		</div>
	);
};
