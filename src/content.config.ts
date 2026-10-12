import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    // 站内写作台（public/admin）用它命名文件，因此必须是小写英文+连字符。
    // 网页路由仍由文件名决定（见 src/core/content/blog.ts 的 post.id）。
    slug: z.string().optional(),
    description: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(["tech", "anime", "life"]).default("tech"),
    draft: z.boolean().default(false)
  })
});

export const collections = { blog };
