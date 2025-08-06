# 🗺️ Rustquant HFT Framework Blog - Mindmap Edition

This Astro blog has been enhanced with interactive mindmap/graph organization features to transform your HFT documentation into an interconnected knowledge graph.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development
```bash
npm run dev
```

### 3. Build & Deploy
```bash
npm run build
npm run deploy
```

## 🧠 Mindmap Features Overview

### Interactive Knowledge Graph
- **Visual relationships** between articles using D3.js
- **Color-coded branches**: Architecture (blue), Performance (red), Components (green), Foundations (orange)
- **Interactive navigation**: Click nodes to navigate, drag to explore
- **Filtering controls**: View by branch or difficulty level

### Smart Navigation
- **Hierarchical breadcrumbs**: Home > Blog > HFT Framework > Branch > Article
- **Related articles sidebar**: Prerequisites, related topics, same-branch articles, next steps
- **Learning paths**: Automatic suggestions based on difficulty progression

### Wiki-Style Linking
- Use `[[Article Name]]` syntax in markdown - automatically converts to proper links
- Intelligent slug resolution handles various title formats
- Cross-references between articles maintain knowledge graph structure

## 📝 Content Structure

### Enhanced Frontmatter Schema

All blog posts now support these mindmap fields:

```yaml
---
title: "Your Article Title"
description: "Article description"
pubDate: "2025-01-01"
# Mindmap/Graph Fields
mindmapBranch: "Architecture"           # Main category
concepts: ["Memory Management", "SIMD"]  # Related concepts  
relatedArticles: ["other-article-slug"] # Cross-references
prerequisites: ["foundation-article"]   # Required reading
difficulty: "intermediate"              # beginner|intermediate|advanced
tags: ["rust", "hft", "performance"]   # Topic tags
seriesOrder: 2                         # Position in learning sequence
---
```

### Branch Categories
- **Architecture**: System design, memory management, threading models
- **Performance**: Latency optimization, throughput, benchmarking  
- **Components**: Trading engine, order management, market data processing
- **Foundations**: Basic concepts, setup, introductory topics

## 🎨 New Components

### 1. MindmapGraph.astro
Interactive D3.js visualization showing article relationships
```astro
<MindmapGraph 
  articles={allBlogPosts}
  currentArticleSlug="current-slug"
  width={800}
  height={600}
/>
```

### 2. Breadcrumbs.astro  
Hierarchical navigation with concept tags
```astro
<Breadcrumbs 
  mindmapBranch="Architecture"
  title="Article Title"
  concepts={["Memory", "Performance"]}
/>
```

### 3. RelatedArticles.astro
Smart sidebar showing prerequisites, related content, and learning paths
```astro
<RelatedArticles 
  currentSlug="current-article"
  relatedArticles={["related-slug"]}
  prerequisites={["prereq-slug"]}
  mindmapBranch="Architecture"
  allArticles={allBlogPosts}
/>
```

## 🔧 Layout Usage

### Enhanced Blog Layout
Use `BlogPostEnhanced.astro` instead of the default layout:

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, getEntry } from 'astro:content';
import BlogPostEnhanced from '../../layouts/BlogPostEnhanced.astro';

// ... your existing logic ...

const { Content } = await post.render();
---

<BlogPostEnhanced {...post.data} slug={post.slug}>
  <Content />
</BlogPostEnhanced>
```

## 📊 New Pages

### /blog/mindmap/
Full interactive knowledge graph with:
- Statistics dashboard showing article counts by branch
- Interactive graph with filtering controls
- Article listings organized by category
- Visual legend for branch color coding

## 🔍 Link Resolution

The system intelligently resolves wiki-style links:

```markdown
<!-- These all resolve to the same article -->
[[Building Limit Order Book]]
[[building-limit-order-book]]  
[[Limit Order Book]]
```

## 📋 Migration Checklist

### Updating Existing Articles

1. **Add mindmap metadata** to frontmatter:
   ```yaml
   mindmapBranch: "Components"
   difficulty: "intermediate" 
   concepts: ["Order Management", "Matching Engine"]
   tags: ["rust", "hft", "order-book"]
   ```

2. **Add cross-references**:
   ```yaml
   relatedArticles: ["other-article-slug"]
   prerequisites: ["foundation-article-slug"]  
   ```

3. **Use wiki-style links** in content:
   ```markdown
   See also [[Memory Management Strategies]] for details.
   ```

### Example Article Update

**Before:**
```yaml
---
title: "Building a Limit Order Book" 
description: "Implementation guide"
pubDate: "2025-01-01"
---
```

**After:**
```yaml  
---
title: "Building a Limit Order Book"
description: "Implementation guide" 
pubDate: "2025-01-01"
mindmapBranch: "Components"
concepts: ["Order Management", "Matching Engine", "Data Structures"]
relatedArticles: ["advanced-order-types", "market-data-processing"]
prerequisites: ["hft-foundations"]
difficulty: "intermediate"
tags: ["rust", "hft", "order-book", "matching-engine"]
seriesOrder: 3
---
```

## 🎯 Content Strategy

### Learning Path Design
Structure articles to create clear learning journeys:

1. **Foundations** → Basic concepts, setup
2. **Architecture** → System design decisions  
3. **Components** → Individual system parts
4. **Performance** → Optimization techniques

### Cross-Reference Best Practices
- Link to prerequisites at article beginning
- Reference related concepts inline using `[[Article Name]]`
- Suggest next steps at article end
- Use consistent concept terminology across articles

## 🐛 Troubleshooting

### Common Issues

**Wiki links not resolving:**
- Check article slug matches title format
- Verify article exists in `src/content/blog/`
- Use exact title or slug format in brackets

**Graph not displaying:**
- Ensure D3.js loads properly (check browser console)
- Verify articles have proper mindmap metadata
- Check that relationships reference valid article slugs

**Missing related articles:**
- Verify `relatedArticles` and `prerequisites` arrays use correct slugs
- Check that referenced articles exist
- Ensure mindmap metadata is properly formatted

## 🚀 Future Enhancements

Planned features for the mindmap system:
- [ ] Learning progress tracking
- [ ] Concept dependency visualization  
- [ ] Auto-generated learning paths
- [ ] Search with graph-aware relevance
- [ ] Export functionality for personal knowledge graphs
- [ ] Mobile-optimized graph interactions

## 📚 Additional Resources

- [Astro Documentation](https://docs.astro.build/)
- [D3.js Graph Examples](https://observablehq.com/@d3/gallery)
- [Knowledge Graph Best Practices](https://www.w3.org/TR/vocab-dcat-3/)

---

*Last updated: 2025-08-06*  
*Created by: Claude Code Assistant*