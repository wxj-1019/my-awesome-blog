import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface UseArticleFiltersProps {
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
}

interface UseArticleFiltersReturn {
  selectedCategory: string | null;
  selectedTag: string | null;
  searchQuery: string;
  handleCategoryChange: (categoryId: string | null) => void;
  handleTagChange: (tagId: string | null) => void;
  handleSearchChange: (query: string) => void;
  resetFilters: () => void;
  activeCategory: { id: string; name: string } | undefined;
  activeTag: { id: string; name: string } | undefined;
}

export function useArticleFilters({ categories, tags }: UseArticleFiltersProps): UseArticleFiltersReturn {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams?.get('category');
    const tagParam = searchParams?.get('tag');
    const searchParam = searchParams?.get('search');

    if (categoryParam) setSelectedCategory(categoryParam);
    if (tagParam) setSelectedTag(tagParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedTag(null);
    setSearchQuery('');
  }, [setSelectedCategory, setSelectedTag, setSearchQuery]);

  const handleTagChange = useCallback((tagId: string | null) => {
    setSelectedTag(tagId);
    setSelectedCategory(null);
    setSearchQuery('');
  }, [setSelectedTag, setSelectedCategory, setSearchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const resetFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery('');
  }, [setSelectedCategory, setSelectedTag, setSearchQuery]);

  const activeCategory = categories.find(c => c.id === selectedCategory);
  const activeTag = tags.find(t => t.id === selectedTag);

  return {
    selectedCategory,
    selectedTag,
    searchQuery,
    handleCategoryChange,
    handleTagChange,
    handleSearchChange,
    resetFilters,
    activeCategory,
    activeTag
  };
}
