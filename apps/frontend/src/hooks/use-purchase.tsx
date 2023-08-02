"use client";

export const usePurchase = () => {
	/* const [ready] = useState(false);

	const { platform } = useDevice();

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
		void CapacitorPurchases.setup({
			apiKey: platform === "ios" ? rcAppleKey : rcGoogleKey
		});
	}, [platform]);

	useEffect(() => {
		void (async () => {
			const { offerings } = await CapacitorPurchases.getOfferings();
		})();
	}, [supportedPlans, platform]); */

	return {
		ready: false
	};
};
