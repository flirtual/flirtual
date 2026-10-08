import type { CustomerInfo, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import {
	createContext,

	use,
	useCallback,
	useEffect,
	useMemo,
	useState
} from "react";
import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { getChargebee } from "~/api/chargebee";
import { isWretchError } from "~/api/common";
import { Subscription } from "~/api/subscription";
import { premium } from "~/api/user";
import { rcAppleKey, rcGoogleKey } from "~/const";
import { useNavigate } from "~/i18n";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

import { useDevice } from "./use-device";
import { usePlans } from "./use-plans";
import { useSession } from "./use-session";
import { useToast } from "./use-toast";

interface PurchaseContext {
	purchase: (planId?: string) => Promise<void>;
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
			try {
				const { Purchases } = await getPurchaseModule();
				await Purchases.configure({
					apiKey: platform === "apple" ? rcAppleKey : rcGoogleKey,
					appUserID
				});
			}
			catch (reason) {
				configurePromise = null;
				throw reason;
			}
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

const reconciled = new Set<string>();

// Out-of-app purchases don't reach the user's customer until the SDK syncs them.
async function reconcileUnseen(customerInfo: CustomerInfo) {
	const entitlement = customerInfo.entitlements.active.premium;
	if (!entitlement) return;

	const key = `${entitlement.productIdentifier}:${entitlement.latestPurchaseDate}`;
	if (reconciled.has(key)) return;
	reconciled.add(key);

	try {
		await Subscription.reconcile();
	}
	catch (reason) {
		reconciled.delete(key);
		throw reason;
	}
	await invalidate({ queryKey: sessionKey() });
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
	const { t } = useTranslation();

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

	const hasPremium = user ? premium(user) : false;

	useEffect(() => {
		if (!revenuecatId || !native || hasPremium) return;
		if (platform === "web") return;

		let cancelled = false;
		let listener: string | null = null;

		const onCustomerInfo = (customerInfo: CustomerInfo) => {
			if (cancelled) return;
			reconcileUnseen(customerInfo).catch(() => {});
		};

		void (async () => {
			await ensureConfigured(platform, revenuecatId);
			await ensureIdentified(revenuecatId);
			if (cancelled) return;

			const { Purchases } = await getPurchaseModule();
			const callbackId = await Purchases.addCustomerInfoUpdateListener(onCustomerInfo);
			if (cancelled) {
				await Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: callbackId });
				return;
			}
			listener = callbackId;

			const { customerInfo } = await Purchases.getCustomerInfo();
			onCustomerInfo(customerInfo);
		})();

		return () => {
			cancelled = true;
			if (!listener) return;

			const listenerToRemove = listener;
			void getPurchaseModule().then(({ Purchases }) =>
				Purchases.removeCustomerInfoUpdateListener({ listenerToRemove })
			);
		};
	}, [platform, native, revenuecatId, hasPremium]);

	const purchase = useCallback(
		async (planId?: string): Promise<void> => {
			if (!native) {
				const chargebee = await getChargebee();

				if (planId) {
					await new Promise<void>((resolve, reject) => {
						chargebee.openCheckout({
							hostedPage: () =>
								Subscription.checkout(planId).catch((reason) => {
									if (isWretchError(reason) && reason.json?.error)
										throw new Error(t(`errors.${reason.json.error}` as any));
									throw reason;
								}),
							success: () => {
								void (async () => {
									await invalidate({ queryKey: sessionKey() });
									await navigate(urls.subscription.success);
									resolve();
								})();
							},
							error: reject,
							close: () => resolve()
						});
					});
					return;
				}

				chargebee.setPortalSession(() => Subscription.manage());
				const portal = chargebee.createChargebeePortal();
				await new Promise<void>((resolve) => {
					portal.open({
						close: () => {
							void invalidate({ queryKey: sessionKey() });
							resolve();
						}
					});
				});
				return;
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
				return;
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
				return;
			}

			const aPackage = await getPackage(plan.revenuecatId);

			if (!aPackage) throw new Error("Package not available");

			await Purchases.purchasePackage({ aPackage })
				.then(async () => {
					await invalidate({ queryKey: sessionKey() });
					await navigate(urls.subscription.success);
				})
				.catch((reason) => {
					toasts.addError(reason);
				});
		},
		[native, plans, apple, platform, toasts, navigate, revenuecatId, t]
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
