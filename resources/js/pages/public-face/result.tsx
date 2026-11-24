import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FileText,
  Filter,
  LoaderCircle,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

import PublicFaceLayout from '@/layouts/public-face-layout';
import { LaravelPagination, SearchCategoryCount, SemanticSearchResult } from '@/types';

type PageProps = {
  search?: string;
  category?: string;
  page?: number;
};

const loadingCards = [1, 2, 3];

const emptyResults: LaravelPagination<SemanticSearchResult> = {
  current_page: 1,
  data: [],
  first_page_url: null,
  from: null,
  last_page: 1,
  last_page_url: null,
  links: [],
  next_page_url: null,
  path: '',
  per_page: 10,
  prev_page_url: null,
  to: null,
  total: 0,
};

function getContentPreview(content: string) {
  const plainContent = content.replace(/\s+/g, ' ').trim();

  if (!plainContent) {
    return 'No summary is available for this material yet.';
  }

  return plainContent.length > 220 ? `${plainContent.slice(0, 220)}...` : plainContent;
}

export default function Result({ search = '', category = '', page = 1 }: PageProps) {
  const [query, setQuery] = useState(search);
  const [results, setResults] = useState<LaravelPagination<SemanticSearchResult>>(emptyResults);
  const [categories, setCategories] = useState<SearchCategoryCount[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Keep the input in sync with the search term in the URL.
  useEffect(() => {
    setQuery(search);
  }, [search]);

  // Load the results for the search term, category, and page that are in the URL.
  useEffect(() => {
    if (!search.trim() && !category) {
      setResults(emptyResults);
      setCategories([]);
      setTotalAll(0);
      setIsLoading(false);

      return;
    }

    let ignore = false;
    setIsLoading(true);

    axios
      .get('/semantic-search', {
        params: {
          search,
          category: category || undefined,
          page,
        },
      })
      .then((res) => {
        if (ignore) return;

        setResults(res.data?.results ?? emptyResults);
        setCategories(res.data?.categories ?? []);
        setTotalAll(res.data?.total_all ?? 0);
      })
      .catch(() => {
        if (ignore) return;

        setResults(emptyResults);
        setCategories([]);
        setTotalAll(0);
      })
      .finally(() => {
        if (ignore) return;

        setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search, category, page]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    router.visit('/result', {
      data: { search: query.trim(), page: 1 },
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleCategorySelect = (selectedSlug: string | null) => {
    const nextCategory = category === selectedSlug || !selectedSlug ? undefined : selectedSlug;

    router.visit('/result', {
      data: {
        search,
        category: nextCategory,
        page: 1,
      },
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (nextPage: number) => {
    router.visit('/result', {
      data: {
        search,
        category: category || undefined,
        page: nextPage,
      },
      preserveState: true,
      preserveScroll: true,
    });
  };

  const activeCategoryObj = categories.find((c) => c.slug === category);

  return (
    <PublicFaceLayout title="Search Results">
      <div className="flex flex-1 flex-col py-10">
        <section className="w-full text-center">
          <Link
            href="/"
            className="mx-auto inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0D4E86] focus:ring-4 focus:ring-white/20 focus:outline-none"
          >
            <ArrowLeft size={16} />
            Back to search
          </Link>

          <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-sky-100/80 uppercase">
            Knowledge Hub Search
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-bold text-white sm:text-4xl">Search results</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-sky-100/85 sm:text-base">
            Scan matching materials, confirm dates and categories, then open the document you need.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full flex-col gap-3 rounded-xl border border-white/20 bg-white p-3 shadow-2xl shadow-slate-950/25 sm:flex-row"
          >
            <label htmlFor="result-search" className="sr-only">
              Search knowledge base
            </label>

            <div className="flex min-h-14 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 focus-within:border-[#0D4E86] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0D4E86]/15">
              <Search className="shrink-0 text-slate-400" size={22} />
              <input
                id="result-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search keywords, topics, or materials..."
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#0D4E86] px-7 text-base font-semibold text-white shadow-lg shadow-[#0D4E86]/20 transition hover:bg-[#0A3F6D] focus:ring-4 focus:ring-sky-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#0D4E86]"
            >
              {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </section>

        <section className="mt-10 rounded-xl bg-slate-50 px-4 py-6 text-slate-900 shadow-2xl shadow-slate-950/20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#0D4E86]">
                {isLoading
                  ? 'Searching materials'
                  : activeCategoryObj
                    ? `${results.total} results in ${activeCategoryObj.category}`
                    : `${results.total} results found`}
              </p>
              <h2 className="mt-1 text-2xl leading-tight font-bold text-slate-950">
                {search
                  ? activeCategoryObj
                    ? `Results for "${search}" in ${activeCategoryObj.category}`
                    : `Results for "${search}"`
                  : activeCategoryObj
                    ? `Materials in ${activeCategoryObj.category}`
                    : 'Featured knowledge materials'}
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {isLoading
                ? 'Searching knowledge materials...'
                : results.total > 0
                  ? `Showing ${results.from}-${results.to} of ${results.total}`
                  : 'Try a more specific keyword or title.'}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left Sidebar: Categories */}
            <aside className="w-full shrink-0 lg:w-72">
              <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Filter size={16} className="text-[#0D4E86]" />
                    <span>Categories</span>
                  </div>
                  {category && (
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(null)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D4E86] hover:underline"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-1">
                  {isLoading && (
                    <div className="space-y-2 py-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex h-9 animate-pulse items-center justify-between rounded-lg bg-slate-100 px-3"
                        >
                          <div className="h-3.5 w-24 rounded bg-slate-200" />
                          <div className="h-4 w-6 rounded-full bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoading && categories.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-500">
                      {search.trim() ? 'No categories found for this search.' : 'Enter a query to see categories.'}
                    </p>
                  )}

                  {!isLoading && categories.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(null)}
                        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                          !category
                            ? 'bg-[#0D4E86] text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        <span className="truncate">All Categories</span>
                        <span
                          className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            !category
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          {totalAll}
                        </span>
                      </button>

                      {categories.map((cat) => {
                        const isActive = category === cat.slug;
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => handleCategorySelect(cat.slug)}
                            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                              isActive
                                ? 'bg-[#0D4E86] text-white shadow-sm'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                            }`}
                          >
                            <span className="truncate text-left">{cat.category}</span>
                            <span
                              className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}
                            >
                              {cat.count}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </aside>

            {/* Right Column: Search Results */}
            <div className="min-w-0 flex-1">
              <div className="grid gap-4">
                {isLoading &&
                  loadingCards.map((item) => (
                    <article
                      key={item}
                      className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="w-full max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="h-7 w-36 rounded-full bg-slate-100" />
                            <div className="h-4 w-28 rounded bg-slate-100" />
                          </div>
                          <div className="mt-5 h-6 w-3/4 rounded bg-slate-100" />
                          <div className="mt-4 space-y-3">
                            <div className="h-4 w-full rounded bg-slate-100" />
                            <div className="h-4 w-11/12 rounded bg-slate-100" />
                            <div className="h-4 w-2/3 rounded bg-slate-100" />
                          </div>
                        </div>
                        <div className="h-11 w-32 shrink-0 rounded-lg bg-slate-100" />
                      </div>
                    </article>
                  ))}

                {!isLoading && results.data.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D4E86]/10 text-[#0D4E86]">
                      <FileSearch size={25} />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-slate-950">
                      {search.trim()
                        ? 'No materials found'
                        : category
                          ? 'No materials found in this category'
                          : 'Start typing to search'}
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      {search.trim()
                        ? activeCategoryObj
                          ? `No materials in "${activeCategoryObj.category}" match your search. Try another category or clear the filter.`
                          : 'Try another keyword, topic, or material title to search the knowledge hub.'
                        : activeCategoryObj
                          ? `There are currently no published materials categorized under "${activeCategoryObj.category}".`
                          : 'Enter a keyword, topic, or material title above to search the knowledge hub.'}
                    </p>
                    {category && (
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(null)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0D4E86] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0A3F6D]"
                      >
                        <X size={14} />
                        Clear Category Filter
                      </button>
                    )}
                  </div>
                )}

                {!isLoading &&
                  results.data.map((item) => {
                    const viewUrl = item.view_url
                      ? search && !item.view_url.includes('search=')
                        ? `${item.view_url}${item.view_url.includes('?') ? '&' : '?'}search=${encodeURIComponent(search)}`
                        : item.view_url
                      : null;

                    return (
                      <article
                        key={item.material_id}
                        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0D4E86]/40 hover:shadow-lg hover:shadow-slate-950/5"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                              {item.categories.map((categoryItem) => (
                                <button
                                  key={`${item.material_id}-${categoryItem.category}`}
                                  type="button"
                                  onClick={() => handleCategorySelect(categoryItem.slug)}
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                                    category === categoryItem.slug
                                      ? 'bg-[#0D4E86] text-white'
                                      : 'bg-[#0D4E86]/10 text-[#0D4E86] hover:bg-[#0D4E86] hover:text-white'
                                  }`}
                                >
                                  <Tag size={13} />
                                  {categoryItem.category}
                                </button>
                              ))}
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600">
                                <CalendarDays size={14} />
                                {item.publish_date
                                  ? new Date(`${item.publish_date}T00:00:00`).toLocaleDateString(
                                      'en-PH',
                                      {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      }
                                    )
                                  : 'No publication date'}
                              </span>
                            </div>

                            <h3 className="mt-4 text-xl leading-snug font-bold text-slate-950">
                              {viewUrl ? (
                                <a
                                  href={viewUrl}
                                  className="transition hover:text-[#0D4E86] hover:underline"
                                >
                                  {item.title}
                                </a>
                              ) : (
                                item.title
                              )}
                            </h3>
                            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                              {getContentPreview(item.content)}
                            </p>
                          </div>

                          {viewUrl ? (
                            <a
                              href={viewUrl}
                              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:bg-[#0D4E86] hover:text-white focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none"
                            >
                              <FileText size={16} />
                              View
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-400"
                            >
                              <FileText size={16} />
                              No PDF
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>

              {!isLoading && results.last_page > 1 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
                  <p className="text-sm text-slate-500">
                    Page {results.current_page} of {results.last_page}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isLoading || results.current_page <= 1}
                      onClick={() => handlePageChange(results.current_page - 1)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={isLoading || results.current_page >= results.last_page}
                      onClick={() => handlePageChange(results.current_page + 1)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0D4E86] px-4 text-sm font-semibold text-white transition hover:bg-[#0A3F6D] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PublicFaceLayout>
  );
}
