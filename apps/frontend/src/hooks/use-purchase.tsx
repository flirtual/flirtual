"use client";

import {
	PropsWithChildren,
	FC,
	createContext,
	useContext,
	useEffect,
	useCallback
} from "react";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { useRouter } from "next/navigation";

import { rcAppleKey, rcGoogleKey } from "~/const";
import { urls } from "~/urls";
import { api } from "~/api";

import { useDevice } from "./use-device";
import { useSessionUser } from "./use-session";
import { usePlans } from "./use-plans";
import { useToast } from "./use-toast";

interface PurchaseContext {
	purchase: (planId: string) => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContext>({} as PurchaseContext);

export const PurchaseProvider: FC<PropsWithChildren> = ({ children }) => {
	const { platform, native } = useDevice();
	const toasts = useToast();
	const router = useRouter();

	const user = useSessionUser();

	const plans = usePlans();

	useEffect(() => {
		void (async () => {
			if (!user?.revenuecatId || !native) return;
			console.log("store: before ready");

			await Purchases.configure({
				apiKey: platform === "ios" ? rcAppleKey : rcGoogleKey,
				appUserID: user?.revenuecatId
			});
		})();
	}, [platform, native, user?.revenuecatId]);

	const purchase = useCallback(
		async (planId: string) => {
			if (!native) {
				const url = user?.subscription?.active
					? api.subscription.manageUrl().toString()
					: api.subscription.checkoutUrl(planId).toString();

				return router.push(url);
			}

			const plan = plans?.find((plan) => plan.id === planId);

			if (!plan || !plan.googleId || !plan.appleId || !plan.revenuecatId)
				throw new Error("Plan not available");

			const productId = platform === "ios" ? plan.appleId : plan.googleId;
			const { customerInfo } = await Purchases.getCustomerInfo();

			if (
				customerInfo.activeSubscriptions.includes(productId) &&
				customerInfo.managementURL
			) {
				return router.push(customerInfo.managementURL);
			}

			const aPackage = (
				await Purchases.getOfferings()
			).current?.availablePackages.find(
				(availablePackage) => availablePackage.identifier === plan.revenuecatId
			);

			if (!aPackage) throw new Error("Package not available");

			return Purchases.purchasePackage({ aPackage })
				.then(() => {
					router.refresh();
					return router.push(urls.subscription.success);
				})
				.catch((reason) => {
					toasts.addError(reason);
				});
		},
		[router, toasts, plans, native, user?.subscription?.active, platform]
	);

	return (
		<PurchaseContext.Provider
			value={{
				purchase
			}}
		>
			{children}
		</PurchaseContext.Provider>
	);
};

export const usePurchase = () => {
	return useContext(PurchaseContext);
};
