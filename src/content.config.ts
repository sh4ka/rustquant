import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    // Mindmap/Graph organization fields
    mindmapBranch: z.string().optional(), // e.g., "Architecture", "Performance", "Components"
    concepts: z.array(z.string()).optional(), // Related concepts for graph connections
    relatedArticles: z.array(z.string()).optional(), // Cross-references to other articles
    prerequisites: z.array(z.string()).optional(), // Learning dependencies
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    tags: z.array(z.string()).optional(), // For categorization and filtering
    seriesOrder: z.number().optional(), // Order within a learning path
  }),
});

const resources = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/resources", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog, resources };
