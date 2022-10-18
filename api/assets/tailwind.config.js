// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

let plugin = require('tailwindcss/plugin')

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
  content: [
    './js/**/*.js',
    '../lib/*_web.ex',
    '../lib/*_web/**/*.*ex'
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      colors: {
        brand: colors
      },
      backgroundImage: {
        "brand-gradient": `linear-gradient(to right, ${colors.coral}, ${colors.pink})`
      },
      boxShadow: {
        "brand-1": "0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2)"
      },
      animation: {
        "scroll-x-screen": "scroll-x-screen 5s linear infinite"
      },
      keyframes: {
        "scroll-x-screen": {
          "0%": { translate: "" }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    plugin(({ addVariant }) => addVariant('phx-no-feedback', ['&.phx-no-feedback', '.phx-no-feedback &'])),
    plugin(({ addVariant }) => addVariant('phx-click-loading', ['&.phx-click-loading', '.phx-click-loading &'])),
    plugin(({ addVariant }) => addVariant('phx-submit-loading', ['&.phx-submit-loading', '.phx-submit-loading &'])),
    plugin(({ addVariant }) => addVariant('phx-change-loading', ['&.phx-change-loading', '.phx-change-loading &']))
  ]
}
