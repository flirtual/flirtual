declare global {
	interface Window {
		Blinkloader: {
			optimize: (options: unknown) => void;
		};
	}
}

const element = document.createElement("script");
element.setAttribute("src", "https://media.flirtu.al/libs/blinkloader/3.x/blinkloader.min.js");

element.addEventListener("load", () => {
	window.Blinkloader.optimize({
		pubkey: "130267e8346d9a7e9bea",
		cdnBase: "https://media.flirtu.al",
		lazyload: false,
		smartCompression: true,
		retina: true,
		webp: true,
		responsive: true,
		fadeIn: true
	});
});

document.body.appendChild(element);
export {};
