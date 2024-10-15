// @ts-check
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import astroMetaTags from "astro-meta-tags";

// https://astro.build/config
export default defineConfig({
	site: "https://stablestudio.org",
	output: "hybrid",
	adapter: vercel(),
	integrations: [
		sitemap(),
		tailwind({
			applyBaseStyles: false,
		}),
		astroMetaTags(),
	],
	prefetch: {
		defaultStrategy: "viewport",
		prefetchAll: true,
	},
	image: {
		remotePatterns: [{ protocol: "https" }],
	},
});