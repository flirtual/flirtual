import { useState, useEffect, useMemo } from "react";

import { useDevice } from "./use-device";

import "cordova-plugin-purchase";
import { usePlans } from "./use-plans";

const { store, Platform, ProductType, Product } = CdvPurchase;
store.error(console.error);

// store.verbosity = LogLevel.DEBUG;

export const useInAppPurchase = () => {
  const [ready, setReady] = useState(false);
  const { platform } = useDevice();

  const [products, setProducts] = useState<
    Record<string, InstanceType<typeof Product>>
  >({});
  const plans = usePlans();

  const supportedPlans = useMemo(
    () =>
      plans.filter((plan) => {
        return !!(platform === "ios" ? plan.appleId : plan.googleId);
      }),
    [plans, platform]
  );

  useEffect(() => {
    console.log("store: before ready");
    store.ready(() => {
      setReady(true);
      console.log("store: ready");
    });
  }, []);

  useEffect(() => {
    void (async () => {
      const products = supportedPlans.map((plan) => ({
        id: (platform === "ios" ? plan.appleId : plan.googleId)!,
        platform:
          platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY,
        type: ProductType.PAID_SUBSCRIPTION
      }));

      console.log("store: before products register", products);
      store.register(products);
      console.log("store: after products register");

      console.log("store: before initialize");
      await store.initialize();
      console.log("store: after initialize");

      console.log("store: before update");
      await store.update();
      console.log("store: after update");

      console.log("store: products get", store.products);

      store.when().productUpdated((product) => {
        setProducts((products) => ({
          ...products,
          [product.id]: product
        }));
      });
    })();
  }, [supportedPlans, platform, ready]);

  return {
    loaded: ready,
    products,
    store
  };
};
