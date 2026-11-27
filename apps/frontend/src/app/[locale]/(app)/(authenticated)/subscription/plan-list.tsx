import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { activeEntitlements } from "~/api/user";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

import { PlanCard } from "./plan-card";

export const PlanList: FC = () => {
	const { vision } = useDevice();
	const session = useOptionalSession();
	const [purchasePending, setPurchasePending] = useState(false);
	const { t } = useTranslation();

	if (!session || vision) return null;

	const user = session.user;

	if (
		activeEntitlements(user).some(
			(entitlement) => entitlement.plan.id === "lifetime"
		)
	) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 gap-8 desktop:grid-cols-3 desktop:gap-4">
			{[
				{
					id: "monthly",
					oneMonthId: "monthly",
					duration: t("monthly"),
					price: 14.99
				},
				{
					id: "three_months",
					oneMonthId: "monthly",
					duration: t("every_number_months", { number: 3 }),
					price: 29.99,
					originalPrice: 44.97,
					highlight: true
				},
				{
					id: "six_months",
					oneMonthId: "monthly",
					duration: t("every_number_months", { number: 6 }),
					price: 44.99,
					originalPrice: 89.94
				}
			].map((item) => {
				return (
					<PlanCard
						{...item}
						key={item.id}
						disabled={purchasePending}
						setPurchasePending={setPurchasePending}
					/>
				);
			})}
			<div className="col-span-full flex flex-col gap-2">
				<PlanCard
					id="lifetime"
					disabled={purchasePending}
					duration={t("lifetime")}
					price={129.99}
					setPurchasePending={setPurchasePending}
				/>
			</div>
		</div>
	);
};
