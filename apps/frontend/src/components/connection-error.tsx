import { AlertCircle } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

export const ConnectionError: FC = () => {
	const [searchParameters] = useSearchParams();
	const { t } = useTranslation();

	const error = searchParameters.get("error");
	if (!error) return null;

	return (
		<div className="mb-8 flex gap-2 font-nunito text-lg text-red-600 dark:text-red-400">
			<AlertCircle className="mt-0.5 size-6 shrink-0" />
			<span>
				{t(`errors.${error}` as any, { defaultValue: t("errors.connection_error_generic") })}
			</span>
		</div>
	);
};
