"use client";

import {
	type PropsWithChildren,
	type FC,
	createContext,
	useContext,
	useEffect,
	useCallback,
	useState
} from "react";
import {
	Purchases,
	type PurchasesPackage
} from "@revenuecat/purchases-capacitor";
import { useRouter } from "next/navigation";

import { rcAppleKey, rcGoogleKey } from "~/const";
import { urls } from "~/urls";
import { api } from "~/api";

import { useDevice } from "./use-device";
import { useSessionUser } from "./use-session";
import { usePlans } from "./use-plans";
import { useToast } from "./use-toast";

interface PurchaseContext {
	purchase: (planId?: string) => Promise<void | string>;
	packages: Array<PurchasesPackage>;
}

const PurchaseContext = createContext<PurchaseContext>({} as PurchaseContext);

export const getPackage = async (revenuecatId: string) => {
	return (await Purchases.getOfferings()).current?.availablePackages.find(
		(availablePackage) => availablePackage.identifier === revenuecatId
	);
};

export const PurchaseProvider: FC<PropsWithChildren> = ({ children }) => {
	const { platform, native } = useDevice();
	const toasts = useToast();
	const router = useRouter();

	const [packages, setPackages] = useState<Array<PurchasesPackage>>([]);

	const user = useSessionUser();

	const plans = usePlans();

	useEffect(() => {
		void (async () => {
			if (!user?.revenuecatId || !native) return;

			await Purchases.configure({
				apiKey: platform === "apple" ? rcAppleKey : rcGoogleKey,
				appUserID: user?.revenuecatId
			});

			const offerings = await Purchases.getOfferings();
			setPackages(offerings.current?.availablePackages ?? []);
		})();
	}, [platform, native, user?.revenuecatId]);

	const purchase = useCallback(
		async (planId?: string) => {
			if (!native) {
				return planId
					? api.subscription.checkoutUrl(planId).toString()
					: api.subscription.manageUrl().toString();
			}

			const { customerInfo } = await Purchases.getCustomerInfo();

			if (!planId && customerInfo.managementURL) {
				window.open(customerInfo.managementURL, "_blank");
				return;
			}

			const plan = plans?.find((plan) => plan.id === planId);

			if (!plan || !plan.googleId || !plan.appleId || !plan.revenuecatId)
				throw new Error("Plan not available");

			const productId = platform === "apple" ? plan.appleId : plan.googleId;

			if (
				customerInfo.activeSubscriptions.includes(productId) &&
				customerInfo.managementURL
			) {
				window.open(customerInfo.managementURL, "_blank");
				return;
			}

			const aPackage = await getPackage(plan.revenuecatId);

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
		[native, plans, platform, router, toasts]
	);

	return (
		<PurchaseContext.Provider
			value={{
				purchase,
				packages
			}}
		>
			{children}
		</PurchaseContext.Provider>
	);
};

export const usePurchase = () => {
	return useContext(PurchaseContext);
};
