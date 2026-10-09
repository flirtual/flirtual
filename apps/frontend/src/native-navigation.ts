import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export interface NativeNavigationTab {
	id: string;
	title: string;
	// An asset in the app's catalog, or an SF Symbol.
	icon: string;
	badge?: string;
}

// What the system reserves in the top corners (iPhone Duo's status bar), in points. The height is
// only there when it fits in the top safe area, leaving the rest of the top edge free.
export interface TopCorners {
	left?: number;
	right?: number;
	bottom?: number;
	height?: number;
}

// A fold splitting the page side by side (iPhone Duo partially open in landscape), in points.
export interface Fold {
	x?: number;
	width?: number;
}

// Where the tab bar starts when it runs down a side, in points. Its buttons are anchored to the
// bottom, so anything above this is clear of them.
export interface SideBar {
	top?: number;
	// Its middle, to tell which side it's on.
	x?: number;
}

// Where the tab bar starts when it runs along the bottom (iPhone), in points.
export interface BottomBar {
	top?: number;
}

// How much further than the safe area content keeps from each side to clear the screen's rounded
// corners, in points.
export interface Corners {
	left?: number;
	right?: number;
}

export interface Layout {
	topCorners: TopCorners;
	fold: Fold;
	sideBar: SideBar;
	bottomBar: BottomBar;
	corners: Corners;
}

// A button floating over the page. The page lays out its own version, hidden, to place it.
export interface NativeNavigationAction {
	id: string;
	// An asset in the app's catalog, or an SF Symbol.
	icon: string;
	// A tinted button, for the main action.
	prominent?: boolean;
	tint?: string;
	enabled: boolean;
}

export interface NativeNavigationFrame {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const NativeNavigationPlugin = registerPlugin<{
	update: (options: { visible: boolean; selected?: string; tabs?: Array<NativeNavigationTab>; tint?: string }) => Promise<Layout>;
	// Builds from before this have no such method.
	actions: (options: { actions: Array<NativeNavigationAction>; frame?: NativeNavigationFrame }) => Promise<void>;
	addListener: ((eventName: "action", listener: (event: { id: string }) => void) => Promise<PluginListenerHandle>)
		& ((eventName: "layout", listener: (event: Layout) => void) => Promise<PluginListenerHandle>)
		& ((eventName: "select", listener: (event: { id: string }) => void) => Promise<PluginListenerHandle>);
}>("NativeNavigation");
