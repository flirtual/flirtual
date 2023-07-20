"use client";

import { useState, useEffect, useMemo } from "react";

import { useDevice } from "./use-device";
import { usePlans } from "./use-plans";

import "cordova-plugin-purchase";
import { Dialog } from "@capacitor/dialog";

export type Product = InstanceType<typeof CdvPurchase.Product>;

// store.verbosity = LogLevel.DEBUG;

export const usePurchase = () => {
	const [ready, setReady] = useState(false);
	const [store, setStore] = useState<InstanceType<
		typeof CdvPurchase.Store
	> | null>(null);

	const { platform } = useDevice();

	const [products, setProducts] = useState<Record<string, Product>>({});
	const plans = usePlans();

	const supportedPlans = useMemo(
		() =>
			plans.filter((plan) => {
				return !!(platform === "ios" ? plan.appleId : plan.googleId);
			}),
		[plans, platform]
	);

	useEffect(() => {
		setStore(CdvPurchase.store);
		console.log("store: before ready");
		CdvPurchase.store.ready(() => {
			setReady(true);
			console.log("store: ready");
		});
	}, []);

	useEffect(() => {
		const { store, Platform, ProductType } = CdvPurchase;

		void (async () => {
			const products = supportedPlans.map((plan) => ({
				id: (platform === "ios" ? plan.appleId : plan.googleId)!,
				platform:
					platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY,
				type: ProductType.PAID_SUBSCRIPTION
			}));

			store.register(products);

			await store.initialize();
			await store.update();

			store.when().productUpdated((product) => {
				setProducts((products) => ({
					...products,
					[product.id]: product
				}));
			});

			store.when().approved((transaction) => {
				void Dialog.alert({
					title: `Purchase successful`,
					message: JSON.stringify(transaction, null, 2)
				});
			});
		})();
	}, [supportedPlans, platform, ready]);

	return {
		ready,
		products,
		store
	};
};
