import { App } from "@capacitor/app";
import { SocialLogin } from "@capgo/capacitor-social-login";

import { apiUrl, appleSigninServiceId, googleClientId, googleIosClientId } from "./const";
import { device } from "./hooks/use-device";
import { log } from "./log";

const cancelGraceMs = 1500;

export async function initializeSocialLogin(): Promise<void> {
	if (!device.native) return;
	if (!appleSigninServiceId && !googleClientId) return;

	try {
		await SocialLogin.initialize({
			...(appleSigninServiceId && {
				apple: {
					clientId: appleSigninServiceId,
					useProperTokenExchange: true,
					...(device.android && {
						redirectUrl: `${apiUrl}connections/grant?type=apple_android`
					})
				}
			}),
			...(googleClientId && {
				google: {
					webClientId: googleClientId,
					mode: "online" as const,
					...(googleIosClientId && {
						iOSClientId: googleIosClientId,
						iOSServerClientId: googleClientId
					})
				}
			})
		});
		log("SocialLogin initialized");
	}
	catch (reason) {
		console.warn("SocialLogin initialization failed:", reason);
	}
}

function cancelError() {
	const error = new Error("USER_CANCELLED");
	(error as { code?: string }).code = "USER_CANCELLED";
	return error;
}

// Android's Apple sign-in opens a Custom Tab that reports nothing when the user
// dismisses it, so the login promise never settles. Treat the app returning to
// the foreground with the login still pending as a cancellation, and
// re-initialize to rebuild the AppleProvider.
export async function nativeSocialLogin(
	options: Parameters<typeof SocialLogin.login>[0]
): Promise<Awaited<ReturnType<typeof SocialLogin.login>>> {
	if (!(device.android && options.provider === "apple"))
		return SocialLogin.login(options);

	let settled = false;
	const login = SocialLogin.login(options);
	void login.then(
		() => { settled = true; },
		() => { settled = true; }
	);

	let cancel!: (error: Error) => void;
	const cancelled = new Promise<never>((_resolve, reject) => {
		cancel = reject;
	});

	const listener = await App.addListener("appStateChange", ({ isActive }) => {
		if (!isActive || settled) return;

		setTimeout(() => {
			if (settled) return;
			settled = true;
			void initializeSocialLogin();
			cancel(cancelError());
		}, cancelGraceMs);
	});

	try {
		return await Promise.race([login, cancelled]);
	}
	finally {
		void listener.remove();
	}
}
