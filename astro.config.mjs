// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeExternalLinks from "rehype-external-links";
import remarkWikiLink from "remark-wiki-link";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://rustquant.dev",
  integrations: [mdx(), sitemap()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  markdown: {
    remarkPlugins: [
      [remarkWikiLink, { 
        pageResolver: (name) => [name.replace(/ /g, '-').toLowerCase()],
        hrefTemplate: (permalink) => `/blog/${permalink}/`
      }]
    ],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      [rehypeAutolinkHeadings, { behavior: 'wrap' }]
    ]
  }
});
