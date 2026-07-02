import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#061A24",
        navy: "#082C44",
        steel: "#5C6E7C",
        line: "#D9E2EA",
        mist: "#F4F7F9",
        signal: "#0A4B86",
        success: "#14735B",
        warning: "#B98A45",
        danger: "#B42318",
        gold: "#C7A269",
        ocean: "#155C7C",
        sky: "#6C9BD2",
        pearl: "#FBFCFA"
      },
      boxShadow: {
        panel: "0 20px 55px rgba(6, 26, 36, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
