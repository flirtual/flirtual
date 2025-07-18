import { X } from "lucide-react";
import { useSearchParams } from "react-router";
import type React from "react";
import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { Link } from "~/components/link";
import { urls } from "~/urls";

export const SuccessMessage: React.FC = () => {
	const [searchParameters] = useSearchParams();
	const { t } = useTranslation();

	if (!searchParameters.get("success")) return null;

	return (
		<div className="flex flex-col gap-4 rounded-xl bg-brand-gradient p-6 text-white-20 shadow-brand-1">
			<div className="relative">
				<h1 className="text-xl font-semibold">
					{t("homely_living_owe_coach")}
				</h1>
				<Link
					className="absolute right-0 top-0"
					href={urls.subscription.default}
				>
					<X className="size-6" />
				</Link>
			</div>
			<p>
				{t.rich("remark_butterfly_sum_seasonal", { contact: (children) => (
					<InlineLink
						className="underline"
						highlight={false}
						href={urls.resources.contact}
					>
						{children}
					</InlineLink>
				) })}
			</p>
		</div>
	);
};
