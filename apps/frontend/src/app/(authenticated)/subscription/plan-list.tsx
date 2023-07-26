"use client";

import { FC, useState } from "react";

import { useSession } from "~/hooks/use-session";

import { PlanCard } from "./plan-card";

export const PlanList: FC = () => {
	const [session] = useSession();
	const [purchasePending, setPurchasePending] = useState(false);

	if (!session) return null;

	const user = session.user;
	const { subscription } = user;

	return (
		<>
			{subscription?.plan.id !== "CJv2NQ7AiEimvDoZJ3uQTe" &&
				subscription?.plan.id !== "Di7Sypboma4ryhy6MUagyS" && (
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:gap-4">
						{[
							{
								id: "LVjvu5YE7PjUJxVrkfsnMi",
								duration: "1 month",
								price: 14.99
							},
							{
								id: "fBDvWjdgvG6zEZMj6ZfyNG",
								oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
								duration: "3 months",
								price: 29.99,
								originalPrice: 44.97,
								discount: 33,
								highlight: true
							},
							{
								id: "Wt4aFY7jVzvSNFK9qcYAr5",
								oneMonthId: "LVjvu5YE7PjUJxVrkfsnMi",
								duration: "6 months",
								price: 44.99,
								originalPrice: 89.94,
								discount: 50
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
								discount={user.tags?.includes("legacy_vrlfp") ? 50 : undefined}
								duration="Lifetime"
								id="Di7Sypboma4ryhy6MUagyS"
								originalPrice={129.99}
								price={user.tags?.includes("legacy_vrlfp") ? 64.99 : 129.99}
								setPurchasePending={setPurchasePending}
								description={
									user.tags?.includes("legacy_vrlfp")
										? "50% off for VRLFP users. Thanks for your early support!"
										: undefined
								}
							/>
						</div>
					</div>
				)}
		</>
	);
};
