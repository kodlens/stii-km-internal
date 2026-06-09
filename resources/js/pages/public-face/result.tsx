import { FormEvent, useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, CalendarDays, FileText, Search, Tag } from 'lucide-react';

type PageProps = {
  search?: string;
};

type ResultItem = {
  id: number;
  category: string;
  title: string;
  content: string;
  published_at: string;
  document_url: string | null;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export default function Result({ search = '' }: PageProps) {
  const urlSearch =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('search') ?? ''
      : '';
  const [query, setQuery] = useState(search || urlSearch);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const getSearch = (searchValue: string, page = 1) => {
    if (isLoading) return;

    setIsLoading(true);

    axios
      .get('/get-result', {
        params: { search: searchValue, page },
      })
      .then((res) => {
        const responseResults = res.data?.results ?? res.data?.data ?? res.data;

        if (Array.isArray(responseResults)) {
          setResults(responseResults);
          setPagination({
            current_page: res.data?.current_page ?? page,
            last_page: res.data?.last_page ?? 1,
            per_page: res.data?.per_page ?? 10,
            total: res.data?.total ?? responseResults.length,
          });
        }
      })
      .catch(() => {
        setResults([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const currentSearch = search || urlSearch;

    setQuery(currentSearch);
    getSearch(currentSearch);
  }, [search, urlSearch]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    router.visit('/result', {
      data: { search: query },
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (page: number) => {
    if (isLoading) return;

    getSearch(query, page);
  };

  return (
    <>
      <Head title="Search Results" />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="bg-[#0D4E86] text-white">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0D4E86_0%,#0B4273_58%,#07325A_100%)]" />
            <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:72px_72px]" />

            <div className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
              <header className="flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0D4E86]"
                >
                  <ArrowLeft size={16} />
                  Back
                </Link>
                <img src="/img/app-logo-black-update.png" width={220} alt="dost-stii logo" />
              </header>

              <div className="mx-auto max-w-4xl py-12 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">
                  Knowledge Hub Search
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Search results
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-sky-100/85 sm:text-base">
                  Review matching materials, references, and internal knowledge resources.
                </p>

                <form
                  onSubmit={handleSearch}
                  className="mx-auto mt-8 flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl shadow-slate-950/25 sm:flex-row"
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
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#0D4E86] px-7 text-base font-semibold text-white shadow-lg shadow-[#0D4E86]/20 transition hover:bg-[#0A3F6D] focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#0D4E86]"
                  >
                    <Search size={18} className={isLoading ? 'animate-pulse' : ''} />
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#0D4E86]">
                {isLoading ? 'Searching materials' : `${pagination.total} results found`}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                {query ? `Results for "${query}"` : 'Featured knowledge materials'}
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Searching knowledge materials...' : 'Showing materials from the knowledge hub.'}
            </p>
          </div>

          <div className="grid gap-5">
            {isLoading && [1, 2, 3].map((item) => (
              <article
                key={item}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
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

            {!isLoading && results.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0D4E86]/10 text-[#0D4E86]">
                  <Search size={24} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  No materials found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Try another keyword, topic, or material title to search the knowledge hub.
                </p>
              </div>
            )}

            {!isLoading && results.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#0D4E86]/30 hover:shadow-lg hover:shadow-slate-950/5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0D4E86]/10 px-3 py-1 text-[#0D4E86]">
                        <Tag size={13} />
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {item.published_at}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-slate-950">
                      {item.title}
                    </h3>
                    {/* <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.content}
                    </p> */}
                  </div>

                  {item.document_url ? (
                    <a
                      href={item.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:bg-[#0D4E86] hover:text-white"
                    >
                      <FileText size={16} />
                      View Details
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
            ))}
          </div>

          {!isLoading && pagination.last_page > 1 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
              <p className="text-sm text-slate-500">
                Page {pagination.current_page} of {pagination.last_page}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading || pagination.current_page <= 1}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={isLoading || pagination.current_page >= pagination.last_page}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  className="h-10 rounded-lg bg-[#0D4E86] px-4 text-sm font-semibold text-white transition hover:bg-[#0A3F6D] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
