import { Smartphone } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { lazy } from "~/lazy";

export const PhoneLogin = lazy(() => import("./component").then(({ PhoneLogin }) => PhoneLogin));

export const PhoneLoginButton: FC<{ tabIndex?: number; onClick: () => void }> = ({ tabIndex, onClick }) => {
	const { t } = useTranslation();

	return (
		<Button className="gap-4" kind="secondary" size="sm" tabIndex={tabIndex} type="button" onClick={onClick}>
			<Smartphone className="size-6" />
			<span className="font-montserrat text-lg font-semibold">
				{t("continue_with", { type: t("phone") })}
			</span>
		</Button>
	);
};
