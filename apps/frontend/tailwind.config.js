// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

const plugin = require("tailwindcss/plugin");

const { languageTags } = require("./project.inlang/settings.json");

const colors = {
	"theme-overlay": "var(--theme-text, #F5F5F5)",
	coral: "#FF8975",
	pink: "#E9658B",
	purple: "#b24592",
	cream: "#FFFAF0",
	white: {
		10: "white",
		20: "#F5F5F5",
		25: "#F0F0F0",
		30: "#EBEBEB",
		40: "#E0E0E0",
		50: "#D6D6D6"
	},
	black: {
		90: "black",
		80: "#111111",
		70: "#1e1e1e",
		60: "#3c3c3c",
		50: "#4d4d4d",
		40: "#5C5C5C",
		30: "#707070",
		20: "#858585",
		10: "#999999"
	},
	theme: {
		1: "var(--theme-1)",
		2: "var(--theme-2)",
		"light-1": "var(--light-theme-1)",
		"light-2": "var(--light-theme-2)",
		"dark-1": "var(--dark-theme-1)",
		"dark-2": "var(--dark-theme-2)",
		"friend-1": "var(--friend-theme-1)",
		"friend-2": "var(--friend-theme-2)"
	}
};

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	darkMode: ["class", "[data-theme=\"dark\"]"],
	theme: {
		extend: {
			fontFamily: {
				nunito: "var(--font-nunito)",
				montserrat: "var(--font-montserrat)"
			},
			colors,
			backgroundImage: {
				"brand-gradient": `linear-gradient(to right, var(--theme-1), var(--theme-2))`,
				"brand-gradient-pink": `linear-gradient(to right, var(--brand-theme-1), var(--brand-theme-2))`,
				"brand-gradient-green": `linear-gradient(to right, var(--friend-theme-1), var(--friend-theme-2))`
			},
			borderRadius: {
				half: "50%"
			},
			boxShadow: {
				"brand-1":
					"0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2)",
				"brand-inset":
					"inset 0 0 2px 0 rgba(0, 0, 0, 0.14), inset 0 0 1px -2px rgba(0, 0, 0, 0.12), inset 0 0 5px 0 rgba(0, 0, 0, 0.2)"
			},
			inset: {
				full: "100%"
			},
			spacing: {
				inherit: "inherit",
				"0.5em": "0.5em",
				em: "1em",
			},
			animation: {
				"scroll-x-screen": "scroll-x-screen 60s linear infinite",
				"touch-grass": "touch-grass 0.8s ease-in-out forwards",
				"bounce-x": "bounceX 1s infinite"
			},
			keyframes: {
				"scroll-x-screen": {
					from: { transform: "translateX(0)" },
					to: { transform: "translateX(-100%)" }
				},
				"touch-grass": {
					"0%": { left: "0.75rem" },
					"100%": { left: "calc(100% - 2rem)" }
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
			},
			typography: {
				DEFAULT: {
					css: {
						p: {
							marginTop: 0,
							marginBottom: 0
						},
						h3: {
							marginTop: 0,
							fontSize: "1.3rem"
						},
						strong: {
							fontWeight: 700
						},
						"--tw-prose-body": colors.black[80],
						"--tw-prose-headings": colors.black[80],
						"--tw-prose-lead": colors.black[80],
						"--tw-prose-links": colors.black[80],
						"--tw-prose-bold": colors.black[80],
						"--tw-prose-counters": colors.black[40],
						"--tw-prose-bullets": colors.black[40],
						"--tw-prose-hr": colors.black[80],
						"--tw-prose-quotes": colors.black[80],
						"--tw-prose-quote-borders": colors.black[40],
						"--tw-prose-captions": colors.black[80],
						"--tw-prose-code": colors.black[80],
						"--tw-prose-pre-code": colors.black[80],
						"--tw-prose-pre-bg": colors.black[80],
						"--tw-prose-th-borders": colors.black[80],
						"--tw-prose-td-borders": colors.black[80],
						"--tw-prose-invert-body": colors.white[20],
						"--tw-prose-invert-headings": colors.white[20],
						"--tw-prose-invert-lead": colors.white[20],
						"--tw-prose-invert-links": colors.white[20],
						"--tw-prose-invert-bold": colors.white[20],
						"--tw-prose-invert-counters": colors.white[20],
						"--tw-prose-invert-bullets": colors.white[20],
						"--tw-prose-invert-hr": colors.white[20],
						"--tw-prose-invert-quotes": colors.white[20],
						"--tw-prose-invert-quote-borders": colors.white[20],
						"--tw-prose-invert-captions": colors.white[20],
						"--tw-prose-invert-code": colors.white[20],
						"--tw-prose-invert-pre-code": colors.white[20],
						"--tw-prose-invert-pre-bg": colors.white[20],
						"--tw-prose-invert-th-borders": colors.white[20],
						"--tw-prose-invert-td-borders": colors.white[20]
					}
				}
			}
		},
		screens: {
			desktop: "768px",
			wide: "1024px",
			tall: { raw: "(min-height: 800px)" }
		}
	},
	plugins: [
		require("@tailwindcss/forms"),
		require("@tailwindcss/typography"),
		require("tailwindcss-hocus"),
		require("tailwindcss-animate"),
		require("tailwindcss-motion"),
		plugin(({ addVariant, addComponents }) => {
			// Device specific variants
			addVariant("native", `:is([data-native] &)`);
			addVariant("vision", `:is([data-vision] &)`);

			for (const platform of ["web", "android", "apple"])
				addVariant(platform, `:is([data-platform="${platform}"] &)`);

			// Language specific variants
			for (const language of languageTags)
				addVariant(language, `:is([lang="${language}"] &)`);

			addComponents({
				".focused": {
					"@apply outline-none ring-2 ring-theme-1 ring-offset-2 dark:ring-offset-black-70":
						{}
				},
				".focusable": {
					"@apply focus:outline-none focus:ring-2 focus:ring-theme-1 focus:ring-offset-2 focus:dark:ring-offset-black-70":
						{}
				},
				".focusable-within": {
					"@apply focus:outline-none focus-within:ring-2 focus-within:ring-theme-1 focus-within:ring-offset-2 focus-within:dark:ring-offset-black-70":
						{}
				},
				".text-shadow-brand": {
					"text-shadow":
						"0 0 8px rgba(0,0,0,0.1), 0 2px 2px rgba(0, 0, 0, 0.14), 0 2px 1px rgba(0, 0, 0, 0.12), 0 1px 5px rgba(0, 0, 0, 0.2)"
				},
				".touch-callout-default": {
					"-webkit-touch-callout": "default"
				},
				".touch-callout-none": {
					"-webkit-touch-callout": "none"
				},
				".select-children": {
					"@apply [&_*]:select-text select-text": {}
				}
			});
		})
	]
};
