import { describe, expect, it, vi } from "vitest";

import type { SafeArea } from "./use-safe-area";
import { createSafeAreaStore } from "./use-safe-area";

const none: SafeArea = { top: 0, right: 0, bottom: 0, left: 0 };
const notched: SafeArea = { top: 47, right: 0, bottom: 34, left: 0 };
const landscape: SafeArea = { top: 0, right: 47, bottom: 21, left: 47 };

function setup(initial: SafeArea) {
	let current = initial;
	const measure = vi.fn(() => ({ ...current }));
	const changeListeners = new Set<() => void>();
	const listenForChanges = vi.fn((listener: () => void) => {
		changeListeners.add(listener);
	});
	const store = createSafeAreaStore(measure, listenForChanges);

	return {
		store,
		measure,
		listenForChanges,
		change(next: SafeArea) {
			current = next;
			for (const listener of changeListeners) listener();
		}
	};
}

describe("createSafeAreaStore", () => {
	it("reports no insets, without measuring, before anything subscribes", () => {
		const { store, measure } = setup(notched);

		const first = store.getSnapshot();
		const second = store.getSnapshot();

		expect(first).toEqual(none);
		expect(second).toBe(first);
		expect(measure).not.toHaveBeenCalled();
	});

	it("measures when the first subscriber arrives and notifies it of insets", () => {
		const { store, measure } = setup(notched);
		const subscriber = vi.fn();

		store.subscribe(subscriber);

		expect(measure).toHaveBeenCalledTimes(1);
		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(store.getSnapshot()).toEqual(notched);
	});

	it("doesn't notify the first subscriber when there are no insets", () => {
		const { store } = setup(none);
		const before = store.getSnapshot();
		const subscriber = vi.fn();

		store.subscribe(subscriber);

		expect(subscriber).not.toHaveBeenCalled();
		expect(store.getSnapshot()).toBe(before);
	});

	it("serves reads from the measurement while subscribed", () => {
		const { store, measure } = setup(notched);
		store.subscribe(vi.fn());

		const first = store.getSnapshot();
		const second = store.getSnapshot();

		expect(second).toBe(first);
		expect(measure).toHaveBeenCalledTimes(1);
	});

	it("doesn't listen for changes until something subscribes", () => {
		const { store, listenForChanges } = setup(notched);

		store.getSnapshot();

		expect(listenForChanges).not.toHaveBeenCalled();
	});

	it("re-measures on a change and notifies subscribers of new insets", () => {
		const { store, change } = setup(notched);
		const subscriber = vi.fn();
		store.subscribe(subscriber);
		subscriber.mockClear();
		const before = store.getSnapshot();

		change(landscape);

		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(store.getSnapshot()).toEqual(landscape);
		expect(store.getSnapshot()).not.toBe(before);
	});

	it("keeps the same object and stays quiet when a change leaves the insets equal", () => {
		const { store, measure, change } = setup(notched);
		const subscriber = vi.fn();
		store.subscribe(subscriber);
		subscriber.mockClear();
		const before = store.getSnapshot();
		const measuredBefore = measure.mock.calls.length;

		change({ ...notched });

		expect(measure).toHaveBeenCalledTimes(measuredBefore + 1);
		expect(subscriber).not.toHaveBeenCalled();
		expect(store.getSnapshot()).toBe(before);
	});

	it("listens once, for good, however often subscribers come and go", () => {
		const { store, listenForChanges } = setup(notched);

		store.subscribe(vi.fn())();
		store.subscribe(vi.fn())();
		store.subscribe(vi.fn());

		expect(listenForChanges).toHaveBeenCalledTimes(1);
	});

	it("keeps the insets current while nothing is subscribed", () => {
		const { store, change } = setup(notched);
		store.subscribe(vi.fn())();

		change(landscape);

		expect(store.getSnapshot()).toEqual(landscape);
	});

	it("doesn't re-measure when a subscriber arrives after the first", () => {
		const { store, measure } = setup(notched);
		store.subscribe(vi.fn())();
		const measuredBefore = measure.mock.calls.length;

		store.subscribe(vi.fn());

		expect(measure).toHaveBeenCalledTimes(measuredBefore);
	});

	it("stops notifying a subscriber after it unsubscribes", () => {
		const { store, change } = setup(notched);
		const leaving = vi.fn();
		store.subscribe(leaving)();
		leaving.mockClear();
		const staying = vi.fn();
		store.subscribe(staying);
		staying.mockClear();

		change(landscape);

		expect(leaving).not.toHaveBeenCalled();
		expect(staying).toHaveBeenCalledTimes(1);
	});
});
