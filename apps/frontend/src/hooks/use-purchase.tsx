import type { PurchasesPackage } from "@revenuecat/purchases-capacitor";
import {
	createContext,

	use,
	useCallback,
	useEffect,
	useMemo,
	useState
} from "react";
import type { FC, PropsWithChildren } from "react";

import { Subscription } from "~/api/subscription";
import { rcAppleKey, rcGoogleKey } from "~/const";
import { useNavigate } from "~/i18n";
import { invalidate, sessionKey } from "~/query";
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

async function getPurchaseModule() {
	return import("@revenuecat/purchases-capacitor");
}

let configurePromise: Promise<void> | null = null;

async function ensureConfigured(
	platform: "android" | "apple",
	appUserID: string
) {
	if (!configurePromise) {
		configurePromise = (async () => {
			const { Purchases } = await getPurchaseModule();
			await Purchases.configure({
				apiKey: platform === "apple" ? rcAppleKey : rcGoogleKey,
				appUserID
			});
		})();
	}
	return configurePromise;
}

async function ensureIdentified(appUserID: string) {
	const { Purchases } = await getPurchaseModule();
	const { appUserID: current } = await Purchases.getAppUserID();
	if (current === appUserID) return;
	await Purchases.logIn({ appUserID });
}

async function getPackage(revenuecatId: string) {
	const { Purchases } = await getPurchaseModule();
	return (await Purchases.getOfferings()).current?.availablePackages.find(
		(availablePackage) => availablePackage.identifier === revenuecatId
	);
}

export const PurchaseProvider: FC<PropsWithChildren> = ({ children }) => {
	const { apple, native, platform } = useDevice();

	const toasts = useToast();
	const navigate = useNavigate();

	const [packages, setPackages] = useState<Array<PurchasesPackage>>([]);

	const { user } = useSession();
	const plans = usePlans();

	const revenuecatId = user?.revenuecatId;

	useEffect(() => {
		if (!revenuecatId || !native) return;
		let cancelled = false;

		if (platform === "web") return;

		void (async () => {
			await ensureConfigured(platform, revenuecatId);
			if (cancelled) return;
			await ensureIdentified(revenuecatId);
			if (cancelled) return;
			const { Purchases } = await getPurchaseModule();
			const offerings = await Purchases.getOfferings();
			if (cancelled) return;
			setPackages(offerings.current?.availablePackages ?? []);
		})();

		return () => {
			cancelled = true;
		};
	}, [platform, native, revenuecatId]);

	const purchase = useCallback(
		async (planId?: string): Promise<string | null> => {
			if (!native) {
				return planId
					? Subscription.checkoutUrl(planId)
					: Subscription.manageUrl();
			}

			if (!revenuecatId) throw new Error("Not logged in");
			if (platform === "web") throw new Error("Unsupported platform");

			await ensureConfigured(platform, revenuecatId);
			await ensureIdentified(revenuecatId);

			const { Purchases } = await getPurchaseModule();

			const { appUserID } = await Purchases.getAppUserID();
			if (appUserID !== revenuecatId) throw new Error("Identity mismatch");

			const { customerInfo } = await Purchases.getCustomerInfo();

			if (!planId && customerInfo.managementURL) {
				window.open(customerInfo.managementURL, "_blank");
				return null;
			}

			const plan = plans?.find((plan) => plan.id === planId);

			if (!plan || !plan.googleId || !plan.appleId || !plan.revenuecatId)
				throw new Error("Plan not available");

			const productId = apple ? plan.appleId : plan.googleId;

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
				.then(async () => {
					await invalidate({ queryKey: sessionKey() });
					await navigate(urls.subscription.success);
					return null;
				})
				.catch((reason) => {
					toasts.addError(reason);
					return null;
				});
		},
		[native, plans, apple, platform, toasts, navigate, revenuecatId]
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
