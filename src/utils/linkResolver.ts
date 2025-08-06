import { getCollection } from 'astro:content';

/**
 * Utility functions for resolving wiki-style links [[Article Name]] to proper URLs
 */

// Cache for article slug mappings
let articleSlugs: Map<string, string> | null = null;

/**
 * Initialize the article slug cache
 */
export async function initializeLinkResolver() {
  if (articleSlugs) return articleSlugs;
  
  const allPosts = await getCollection('blog');
  articleSlugs = new Map();
  
  // Create mappings from title variations to slugs
  allPosts.forEach(post => {
    const title = post.data.title;
    const slug = post.slug;
    
    // Direct title mapping
    articleSlugs!.set(title, slug);
    
    // Lowercase mapping  
    articleSlugs!.set(title.toLowerCase(), slug);
    
    // Slug-based mapping (for cases where wiki link uses slug format)
    articleSlugs!.set(slug, slug);
    
    // Title with spaces replaced by hyphens
    articleSlugs!.set(title.replace(/\s+/g, '-'), slug);
    articleSlugs!.set(title.replace(/\s+/g, '-').toLowerCase(), slug);
    
    // Remove common words and create simplified mappings
    const simplified = title
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/\s+(for|in|with|using|and|or)\s+/gi, ' ')
      .trim();
    
    if (simplified !== title) {
      articleSlugs!.set(simplified, slug);
      articleSlugs!.set(simplified.toLowerCase(), slug);
    }
  });
  
  return articleSlugs;
}

/**
 * Resolve a wiki-style link to a proper URL
 * @param linkText - The text inside [[brackets]]
 * @returns The resolved URL or null if not found
 */
export async function resolveWikiLink(linkText: string): Promise<string | null> {
  await initializeLinkResolver();
  
  // Try exact match first
  let slug = articleSlugs!.get(linkText);
  if (slug) return `/blog/${slug}/`;
  
  // Try lowercase match
  slug = articleSlugs!.get(linkText.toLowerCase());
  if (slug) return `/blog/${slug}/`;
  
  // Try with spaces converted to hyphens
  const hyphenated = linkText.replace(/\s+/g, '-');
  slug = articleSlugs!.get(hyphenated);
  if (slug) return `/blog/${slug}/`;
  
  slug = articleSlugs!.get(hyphenated.toLowerCase());
  if (slug) return `/blog/${slug}/`;
  
  // No match found
  return null;
}

/**
 * Get all article titles for autocomplete/suggestions
 */
export async function getAllArticleTitles(): Promise<string[]> {
  await initializeLinkResolver();
  return Array.from(articleSlugs!.keys());
}

/**
 * Find articles related to given concepts
 */
export async function findRelatedArticles(concepts: string[], currentSlug: string): Promise<Array<{slug: string, title: string, relevance: number}>> {
  const allPosts = await getCollection('blog');
  const related: Array<{slug: string, title: string, relevance: number}> = [];
  
  allPosts.forEach(post => {
    if (post.slug === currentSlug) return;
    
    let relevance = 0;
    const postConcepts = post.data.concepts || [];
    const postTags = post.data.tags || [];
    const postTitle = post.data.title.toLowerCase();
    
    // Check concept overlap
    concepts.forEach(concept => {
      if (postConcepts.some(pc => pc.toLowerCase().includes(concept.toLowerCase()))) {
        relevance += 3;
      }
      if (postTags.some(tag => tag.toLowerCase().includes(concept.toLowerCase()))) {
        relevance += 2;
      }
      if (postTitle.includes(concept.toLowerCase())) {
        relevance += 1;
      }
    });
    
    if (relevance > 0) {
      related.push({
        slug: post.slug,
        title: post.data.title,
        relevance
      });
    }
  });
  
  // Sort by relevance and return top matches
  return related
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

/**
 * Get learning path suggestions based on difficulty and prerequisites
 */
export async function getLearningPath(currentSlug: string): Promise<{
  previous: Array<{slug: string, title: string}>,
  next: Array<{slug: string, title: string}>
}> {
  const allPosts = await getCollection('blog');
  const currentPost = allPosts.find(p => p.slug === currentSlug);
  
  if (!currentPost) {
    return { previous: [], next: [] };
  }
  
  const currentDifficulty = currentPost.data.difficulty;
  const currentBranch = currentPost.data.mindmapBranch;
  const currentPrereqs = currentPost.data.prerequisites || [];
  
  // Find previous articles (prerequisites or easier articles in same branch)
  const previous = allPosts
    .filter(post => {
      if (post.slug === currentSlug) return false;
      
      // Direct prerequisites
      if (currentPrereqs.includes(post.slug)) return true;
      
      // Same branch, easier difficulty
      if (post.data.mindmapBranch === currentBranch) {
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        const postDiffIndex = difficulties.indexOf(post.data.difficulty || 'beginner');
        const currentDiffIndex = difficulties.indexOf(currentDifficulty || 'beginner');
        return postDiffIndex < currentDiffIndex;
      }
      
      return false;
    })
    .map(post => ({ slug: post.slug, title: post.data.title }))
    .slice(0, 3);
  
  // Find next articles (articles that list current as prerequisite, or harder in same branch)
  const next = allPosts
    .filter(post => {
      if (post.slug === currentSlug) return false;
      
      // Articles that require current as prerequisite
      if ((post.data.prerequisites || []).includes(currentSlug)) return true;
      
      // Same branch, harder difficulty
      if (post.data.mindmapBranch === currentBranch) {
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        const postDiffIndex = difficulties.indexOf(post.data.difficulty || 'beginner');
        const currentDiffIndex = difficulties.indexOf(currentDifficulty || 'beginner');
        return postDiffIndex > currentDiffIndex;
      }
      
      return false;
    })
    .map(post => ({ slug: post.slug, title: post.data.title }))
    .slice(0, 3);
  
  return { previous, next };
}