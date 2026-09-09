'use client';

import ArticleViewCore from '@/components/article/ArticleViewCore';
import type { Article } from '@/lib/data';

interface ArticleRubrikClientProps {
  initialArticle?: Article | null;
  initialRelated?: Article[];
  slug: string;
  rubrik: string;
}

export default function ArticleRubrikClient({
  initialArticle = null,
  initialRelated = [],
  slug,
  rubrik,
}: ArticleRubrikClientProps) {
  return (
    <ArticleViewCore
      initialArticle={initialArticle}
      initialRelated={initialRelated}
      slug={slug}
      rubrikContext={rubrik}
    />
  );
}
