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

function pluginName({ message }: CapacitorException) {
	return pluginNameExpression.exec(message)?.groups?.name || message;
}

// Don't prompt to update for these plugins.
const ignoredPlugins = new Set(["NotificationSettings"]);

export function isPluginUnimplemented(reason: unknown): reason is CapacitorException {
	return (
		reason instanceof CapacitorException
		&& reason.code === ExceptionCode.Unimplemented
	);
}

export function isAppOutdated(reason: unknown): reason is CapacitorException {
	return (
		client
		&& device.native
		&& isPluginUnimplemented(reason)
		&& !ignoredPlugins.has(pluginName(reason))
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

	const plugin = pluginName(reason);
	log("%s is unimplemented, the app is outdated.", plugin);

	if (!reported.has(plugin)) {
		reported.add(plugin);
		captureException(reason, { tags: { plugin } });
	}

	if (outdatedFor !== plugin) {
		outdatedFor = plugin;
		emit();
	}

	return true;
}

export function dismissAppOutdated() {
	if (!outdatedFor) return;

	outdatedFor = null;
	emit();
}

// The missing plugin.
export function useAppOutdated() {
	return useSyncExternalStore(subscribe, () => outdatedFor, () => null);
}
