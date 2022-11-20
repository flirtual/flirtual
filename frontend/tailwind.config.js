/* eslint-disable no-undef */
// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

let plugin = require("tailwindcss/plugin");

const colors = {
	coral: "#FF8975",
	pink: "#E9658B",
	white: "#FFFAFA",
	black: "#131516",
	grey: "#E4E4E4",
	cream: "#FFFAF0"
};

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				nunito: "var(--font-nunito)",
				montserrat: "var(--font-montserrat)"
			},
			colors: {
				brand: colors
			},
			backgroundImage: {
				"brand-gradient": `linear-gradient(to right, ${colors.coral}, ${colors.pink})`
			},
			borderRadius: {
				half: "50%"
			},
			boxShadow: {
				"brand-1":
					"0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2)"
			},
			animation: {
				"scroll-x-screen": "scroll-x-screen 30s linear infinite",
				"bounce-x": "bounceX 1s infinite"
			},
			keyframes: {
				"scroll-x-screen": {
					from: { transform: "translateX(0)" },
					to: { transform: "translateX(-100%)" }
				},
				"fade-in": {
					"0%": { opacity: "0%" },
					"100%": { opacity: "100%" }
				},
				bounceX: {
					"0%, 100%": {
						transform: "translateX(-25%)",
						animationTimingFunction: "cubic-bezier(0.8,0,1,1)"
					},
					"50%": {
						transform: "none",
						animationTimingFunction: "cubic-bezier(0,0,0.2,1)"
					}
				}
			}
		}
	},
	plugins: [
		require("@tailwindcss/forms"),
		require("tailwindcss-hocus"),
		plugin(({ addVariant }) => {
			addVariant("range-track", [
				"&::-webkit-slider-runnable-track",
				"&::-moz-range-track",
				"&::-ms-track"
			]);
			addVariant("range-thumb", ["&::-webkit-slider-thumb", "&::-moz-range-thumb", "&::-ms-thumb"]);
		})
	]
};
