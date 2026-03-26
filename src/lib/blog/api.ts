import { getTranslations } from "next-intl/server";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  coverImage: string;
  tags: string[];
}

// In a real app, this would come from MDX files or a CMS.
// For now, we mock the blog content.
export const getBlogPosts = async (locale: string): Promise<BlogPost[]> => {
  const t = await getTranslations({ locale, namespace: 'blog' });
  
  return [
    {
      slug: "best-anime-prompts-2026",
      title: t('posts.anime.title'),
      excerpt: t('posts.anime.excerpt'),
      content: t('posts.anime.content'),
      date: "2026-03-20",
      author: "Lavie AI Team",
      coverImage: "https://cdn.lavieai.net/default-blog-1.jpg",
      tags: ["anime", "prompts", "guide"]
    },
    {
      slug: "how-to-generate-ecommerce-product-images",
      title: t('posts.ecommerce.title'),
      excerpt: t('posts.ecommerce.excerpt'),
      content: t('posts.ecommerce.content'),
      date: "2026-03-15",
      author: "Lavie AI Team",
      coverImage: "https://cdn.lavieai.net/default-blog-2.jpg",
      tags: ["ecommerce", "business", "prompts"]
    },
    {
      slug: "understanding-negative-prompts",
      title: t('posts.negative.title'),
      excerpt: t('posts.negative.excerpt'),
      content: t('posts.negative.content'),
      date: "2026-03-10",
      author: "Lavie AI Team",
      coverImage: "https://cdn.lavieai.net/default-blog-3.jpg",
      tags: ["tutorial", "prompts", "guide"]
    }
  ];
};

export const getBlogPostBySlug = async (slug: string, locale: string): Promise<BlogPost | null> => {
  const posts = await getBlogPosts(locale);
  return posts.find(post => post.slug === slug) || null;
};

export const getRelatedPosts = async (currentSlug: string, tags: string[], locale: string, limit = 3): Promise<BlogPost[]> => {
  const posts = await getBlogPosts(locale);
  
  return posts
    .filter(post => post.slug !== currentSlug) // Exclude current post
    .map(post => {
      // Calculate relevance score based on matching tags
      const matchCount = post.tags.filter(tag => tags.includes(tag)).length;
      return { post, matchCount };
    })
    .sort((a, b) => b.matchCount - a.matchCount) // Sort by relevance
    .map(item => item.post)
    .slice(0, limit);
};