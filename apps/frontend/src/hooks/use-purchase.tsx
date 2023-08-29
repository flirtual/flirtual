"use client";

import {
	PropsWithChildren,
	FC,
	createContext,
	useContext,
	useEffect,
	useState
} from "react";
import { CapacitorPurchases, CustomerInfo } from "@capgo/capacitor-purchases";

import { environment, rcAppleKey, rcGoogleKey } from "~/const";

import { useDevice } from "./use-device";
import { useSessionUser } from "./use-session";

interface PurchaseContext {
	customer: CustomerInfo | null;
}

const PurchaseContext = createContext<PurchaseContext>({} as PurchaseContext);

export const PurchaseProvider: FC<PropsWithChildren> = ({ children }) => {
	//const [ready, setReady] = useState(false);

	const { platform } = useDevice();

	const user = useSessionUser();
	const [customer, setCustomer] = useState<CustomerInfo | null>(null);

	//const plans = usePlans();

	useEffect(() => {
		void (async () => {
			if (!user?.revenuecatId || !["android", "ios"].includes(platform)) return;
			console.log("store: before ready");

			await CapacitorPurchases.setDebugLogsEnabled({
				enabled: environment === "development"
			});

			await CapacitorPurchases.setup({
				apiKey: platform === "ios" ? rcAppleKey : rcGoogleKey,
				appUserID: user?.revenuecatId
			});

			const { customerInfo } = await CapacitorPurchases.getCustomerInfo();
			setCustomer(customerInfo);
		})();
	}, [platform, user?.revenuecatId]);

	console.log(customer);

	/* const supportedPlans = useMemo(
		() =>
			plans.filter((plan) => {
				return !!(platform === "ios" ? plan.appleId : plan.googleId);
			}),
		[plans, platform]
	);

	useEffect(() => {
		void (async () => {
			const { offerings } = await CapacitorPurchases.getOfferings();
		})();
	}, [supportedPlans, platform]);
 */

	return (
		<PurchaseContext.Provider
			value={{
				customer
			}}
		>
			{children}
		</PurchaseContext.Provider>
	);
};

export const usePurchase = () => {
	return useContext(PurchaseContext);
};
