// import { useEffect, useState } from "react";

export interface SafeArea {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export function useSafeArea(): SafeArea {
	// Temporary @capacitor-community/safe-area implementation
	const element = document.createElement("div");
	element.style.cssText = "position:absolute;visibility:hidden;top:var(--safe-area-inset-top,0);right:var(--safe-area-inset-right,0);bottom:var(--safe-area-inset-bottom,0);left:var(--safe-area-inset-left,0)";
	document.body.appendChild(element);
	const style = getComputedStyle(element);
	const safeArea = {
		top: Number.parseFloat(style.top) || 0,
		right: Number.parseFloat(style.right) || 0,
		bottom: Number.parseFloat(style.bottom) || 0,
		left: Number.parseFloat(style.left) || 0
	};
	document.body.removeChild(element);
	return safeArea;

	// TODO: Waiting on ionic-team/capacitor#8180
	// const [safeArea, setSafeArea] = useState<SafeArea>({
	// 	top: 0,
	// 	right: 0,
	// 	bottom: 0,
	// 	left: 0
	// });
	//
	// useEffect(() => {
	// 	const updateSafeArea = () => {
	// 		const style = getComputedStyle(document.documentElement);
	// 		setSafeArea({
	// 			top: Number.parseFloat(style.getPropertyValue("--safe-area-inset-top")) || 0,
	// 			right: Number.parseFloat(style.getPropertyValue("--safe-area-inset-right")) || 0,
	// 			bottom: Number.parseFloat(style.getPropertyValue("--safe-area-inset-bottom")) || 0,
	// 			left: Number.parseFloat(style.getPropertyValue("--safe-area-inset-left")) || 0
	// 		});
	// 	};
	//
	// 	updateSafeArea();
	// 	window.addEventListener("safeAreaChanged", updateSafeArea);
	// 	return () => window.removeEventListener("safeAreaChanged", updateSafeArea);
	// }, []);
	//
	// return safeArea;
}
