import { CapacitorException, ExceptionCode } from "@capacitor/core";
import { captureException } from "@sentry/react-router";
import { useSyncExternalStore } from "react";

import { client } from "./const";
import { device } from "./hooks/use-device";
import { log as _log } from "./log";

const log = _log.extend("capacitor");

// `"Foo" plugin is not implemented on platform` or
// `"Foo.bar()" is not implemented on platform`.
const pluginNameExpression = /^"(?<name>[^".(]+)/;

const missingPermissionsExpression = /^Missing the following permissions in AndroidManifest\.xml:\s*(?<permissions>.*)/s;

function missingSupport({ message }: Error) {
	return (
		pluginNameExpression.exec(message)?.groups?.name
		|| missingPermissionsExpression.exec(message)?.groups?.permissions.trim().replaceAll(/\s+/g, ", ")
		|| message
	);
}

// Don't prompt to update for these plugins.
const ignoredPlugins = new Set(["NotificationSettings"]);

export function isPluginUnsupported(reason: unknown): reason is Error {
	return (
		(reason instanceof CapacitorException && reason.code === ExceptionCode.Unimplemented)
		|| (reason instanceof Error && missingPermissionsExpression.test(reason.message))
	);
}

export function isAppOutdated(reason: unknown): reason is Error {
	return (
		client
		&& device.native
		&& isPluginUnsupported(reason)
		&& !ignoredPlugins.has(missingSupport(reason))
	);
}

const reported = new Set<string>();
const listeners = new Set<() => void>();

let outdatedFor: string | null = null;

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => void listeners.delete(listener);
}

function emit() {
	listeners.forEach((listener) => listener());
}

export function reportAppOutdated(reason: unknown): boolean {
	if (!isAppOutdated(reason)) return false;

	const missing = missingSupport(reason);
	log("%s is unsupported, the app is outdated.", missing);

	if (!reported.has(missing)) {
		reported.add(missing);
		captureException(reason, { tags: { missing } });
	}

	if (outdatedFor !== missing) {
		outdatedFor = missing;
		emit();
	}

	return true;
}

export function dismissAppOutdated() {
	if (!outdatedFor) return;

	outdatedFor = null;
	emit();
}

// The missing plugin or permissions.
export function useAppOutdated() {
	return useSyncExternalStore(subscribe, () => outdatedFor, () => null);
}
