"use client";

import { useTranslations } from "next-intl";
import { type FC, useState } from "react";

import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

import { PlanCard } from "./plan-card";

export const PlanList: FC = () => {
	const { native, vision } = useDevice();
	const session = useOptionalSession();
	const [purchasePending, setPurchasePending] = useState(false);
	const t = useTranslations();

	if (!session || vision) return null;

	const user = session.user;
	const { subscription } = user;

	if (!native && subscription?.platform === "stripe" && subscription?.active) {
		return null;
	}

	if (
		subscription
		&& [
			"CJv2NQ7AiEimvDoZJ3uQTe",
			"Di7Sypboma4ryhy6MUagyS",
			"QQd364odDmzV69gsaKTYwm"
		].includes(subscription.plan.id)
	) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 gap-8 desktop:grid-cols-3 desktop:gap-4">
			{[
				{
					id: "LVjvu5YE7PjUJxVrkfsnMi",
					oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
					duration: t("monthly"),
					price: 14.99
				},
				{
					id: "fBDvWjdgvG6zEZMj6ZfyNG",
					oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
					duration: t("every_number_months", { number: 3 }),
					price: 29.99,
					originalPrice: 44.97,
					highlight: true
				},
				{
					id: "Wt4aFY7jVzvSNFK9qcYAr5",
					oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
					duration: t("every_number_months", { number: 6 }),
					price: 44.99,
					originalPrice: 89.94
				}
			].map((item) => {
				return (
					<PlanCard
						{...item}
						disabled={purchasePending}
						key={item.id}
						setPurchasePending={setPurchasePending}
					/>
				);
			})}
			<div className="col-span-full flex flex-col gap-2">
				<PlanCard
					disabled={purchasePending}
					duration={t("lifetime")}
					id="Di7Sypboma4ryhy6MUagyS"
					price={129.99}
					setPurchasePending={setPurchasePending}
				/>
			</div>
		</div>
	);
};
