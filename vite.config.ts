import MillionLint from "@million/lint";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		host: "0.0.0.0",
		port: 5173,
	},
	plugins: [
		MillionLint.vite({
			enabled: true,
		}),
		react(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
