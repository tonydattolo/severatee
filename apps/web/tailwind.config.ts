import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        lumon: {
          blue: "#06396C",
          "light-blue": "#D2E1E7",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
