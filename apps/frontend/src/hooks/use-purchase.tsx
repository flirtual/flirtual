import {
	Purchases,
	type PurchasesPackage
} from "@revenuecat/purchases-capacitor";
import {
	createContext,
	type FC,
	type PropsWithChildren,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState
} from "react";

import { Subscription } from "~/api/subscription";
import { rcAppleKey, rcGoogleKey } from "~/const";
import { useNavigate } from "react-router";
import { urls } from "~/urls";

import { useDevice } from "./use-device";
import { usePlans } from "./use-plans";
import { useSession } from "./use-session";
import { useToast } from "./use-toast";

interface PurchaseContext {
	purchase: (planId?: string) => Promise<string | null>;
	packages: Array<PurchasesPackage>;
}

const PurchaseContext = createContext<PurchaseContext>({} as PurchaseContext);

async function getPackage(revenuecatId: string) {
	return (await Purchases.getOfferings()).current?.availablePackages.find(
		(availablePackage) => availablePackage.identifier === revenuecatId
	);
}

export const PurchaseProvider: FC<PropsWithChildren> = ({ children }) => {
	const { platform, native } = useDevice();

	const toasts = useToast();
	const navigate = useNavigate();

	const [packages, setPackages] = useState<Array<PurchasesPackage>>([]);

	const { user } = useSession();
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
		async (planId?: string): Promise<string | null> => {
			if (!native) {
				return planId
					? Subscription.checkoutUrl(planId)
					: Subscription.manageUrl();
			}

			const { customerInfo } = await Purchases.getCustomerInfo();

			if (!planId && customerInfo.managementURL) {
				window.open(customerInfo.managementURL, "_blank");
				return null;
			}

			const plan = plans?.find((plan) => plan.id === planId);

			if (!plan || !plan.googleId || !plan.appleId || !plan.revenuecatId)
				throw new Error("Plan not available");

			const productId = platform === "apple" ? plan.appleId : plan.googleId;

			if (
				customerInfo.activeSubscriptions.includes(productId)
				&& customerInfo.managementURL
			) {
				window.open(customerInfo.managementURL, "_blank");
				return null;
			}

			const aPackage = await getPackage(plan.revenuecatId);

			if (!aPackage) throw new Error("Package not available");

			return Purchases.purchasePackage({ aPackage })
				.then(() => {
					router.refresh();
					navigate(urls.subscription.success));
					return null;
				})
				.catch((reason) => {
					toasts.addError(reason);
					return null;
				});
		},
		[native, plans, platform, router, toasts]
	);

	return (
		<PurchaseContext
			value={useMemo(() => ({
				purchase,
				packages
			}), [packages, purchase])}
		>
			{children}
		</PurchaseContext>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export function usePurchase() {
	return use(PurchaseContext);
}
