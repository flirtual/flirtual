"use client";

import { TicketPercent } from "lucide-react";
import { type FC, useState } from "react";

import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";

import { PlanCard } from "./plan-card";

export const PlanList: FC = () => {
	const { native, vision } = useDevice();
	const [session] = useSession();
	const [purchasePending, setPurchasePending] = useState(false);

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
					duration: "monthly",
					price: 14.99
				},
				{
					id: "fBDvWjdgvG6zEZMj6ZfyNG",
					oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
					duration: "every 3 months",
					price: 29.99,
					originalPrice: 44.97,
					highlight: native
				},
				{
					id: "Wt4aFY7jVzvSNFK9qcYAr5",
					oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
					duration: "every 6 months",
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
					duration="lifetime"
					highlight={!native}
					id="Di7Sypboma4ryhy6MUagyS"
					originalPrice={native ? undefined : 129.99}
					price={native ? 129.99 : 99.99}
					setPurchasePending={setPurchasePending}
				/>
				{!native && (
					<div className="mt-2 flex flex-row items-center gap-2 self-center text-pink">
						<TicketPercent />
						<span>
							Save 20% on Lifetime Premium until January 7
							<sup>th</sup>
							. Happy New Year!
						</span>
					</div>
				)}
			</div>
		</div>
	);
};
