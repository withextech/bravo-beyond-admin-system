import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#0f172a",
        panel: "#ffffff",
        adminBlue: "#2563eb"
      },
      boxShadow: {
        panel: "0 18px 42px rgba(15, 23, 42, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
