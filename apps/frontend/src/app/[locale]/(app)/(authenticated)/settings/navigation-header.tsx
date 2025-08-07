import { ChevronLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useNavigate } from "~/i18n";
import { urls } from "~/urls";

export const NavigationHeader: React.FC<{ listOnly: boolean }> = ({ listOnly }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const Icon = listOnly ? X : ChevronLeft;

	return (
		<div className="sticky top-0 flex w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(var(--safe-area-inset-top,0rem)+0.5rem),1rem)] text-white-20 desktop:static desktop:bg-transparent desktop:pb-4 desktop:pt-[1.125rem]">
			<button
				className="absolute left-4 flex shrink-0 vision:left-8 desktop:hidden"
				type="button"
				onClick={() => listOnly ? navigate(urls.discover("dates")) : navigate(-1)}
			>
				<Icon className="w-6" />
			</button>
			<span className="font-montserrat text-2xl font-extrabold">{t("settings")}</span>
		</div>
	);
};
