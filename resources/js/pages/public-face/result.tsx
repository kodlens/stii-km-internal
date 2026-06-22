import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, FileSearch, FileText, LoaderCircle, Search, Tag } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PublicFaceLayout from '@/layouts/public-face-layout';

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
    view_url: string | null;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

const emptyPagination: PaginationMeta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
};

const loadingCards = [1, 2, 3];

function getContentPreview(content: string) {
    const plainContent = content.replace(/\s+/g, ' ').trim();

    if (!plainContent) {
        return 'No summary is available for this material yet.';
    }

    return plainContent.length > 220 ? `${plainContent.slice(0, 220)}...` : plainContent;
}

export default function Result({ search = '' }: PageProps) {
    const urlSearch = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('search') ?? '') : '';

    const [query, setQuery] = useState(search || urlSearch);
    const [results, setResults] = useState<ResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const isLoadingRef = useRef(false);
    const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);

    const resultStart = useMemo(() => {
        if (pagination.total === 0) return 0;

        return (pagination.current_page - 1) * pagination.per_page + 1;
    }, [pagination.current_page, pagination.per_page, pagination.total]);

    const resultEnd = useMemo(() => {
        return Math.min(pagination.current_page * pagination.per_page, pagination.total);
    }, [pagination.current_page, pagination.per_page, pagination.total]);

    const getSearch = useCallback((searchValue: string, page = 1) => {
        if (isLoadingRef.current) return;

        isLoadingRef.current = true;
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
                setPagination(emptyPagination);
            })
            .finally(() => {
                isLoadingRef.current = false;
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        const currentSearch = search || urlSearch;

        setQuery(currentSearch);
        getSearch(currentSearch);
    }, [getSearch, search, urlSearch]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isLoadingRef.current) return;

        router.visit('/result', {
            data: { search: query },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        if (isLoadingRef.current) return;

        getSearch(query, page);
    };

    return (
        <PublicFaceLayout title="Search Results">
            <div className="flex flex-1 flex-col py-10">
                <section className="mx-auto w-full max-w-5xl text-center">
                    <Link
                        href="/"
                        className="mx-auto inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0D4E86] focus:ring-4 focus:ring-white/20 focus:outline-none"
                    >
                        <ArrowLeft size={16} />
                        Back to search
                    </Link>

                    <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-sky-100/80 uppercase">Knowledge Hub Search</p>
                    <h1 className="mt-3 text-3xl leading-tight font-bold text-white sm:text-4xl">Search results</h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-sky-100/85 sm:text-base">
                        Scan matching materials, confirm dates and categories, then open the document you need.
                    </p>

                    <form
                        onSubmit={handleSearch}
                        className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-3 rounded-xl border border-white/20 bg-white p-3 shadow-2xl shadow-slate-950/25 sm:flex-row"
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
                                {isLoading ? 'Searching materials' : `${pagination.total} results found`}
                            </p>
                            <h2 className="mt-1 text-2xl leading-tight font-bold text-slate-950">
                                {query ? `Results for "${query}"` : 'Featured knowledge materials'}
                            </h2>
                        </div>

                        <p className="text-sm text-slate-500">
                            {isLoading
                                ? 'Searching knowledge materials...'
                                : pagination.total > 0
                                  ? `Showing ${resultStart}-${resultEnd} of ${pagination.total}`
                                  : 'Try a more specific keyword or title.'}
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4">
                        {isLoading &&
                            loadingCards.map((item) => (
                                <article key={item} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#0D4E86]/10 text-[#0D4E86]">
                                    <FileSearch size={25} />
                                </div>
                                <h3 className="mt-5 text-xl font-bold text-slate-950">No materials found</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Try another keyword, topic, or material title to search the knowledge hub.
                                </p>
                            </div>
                        )}

                        {!isLoading &&
                            results.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0D4E86]/40 hover:shadow-lg hover:shadow-slate-950/5"
                                >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                                {item.category.split(', ').map((category) => (
                                                    <span
                                                        key={`${item.id}-${category}`}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-[#0D4E86]/10 px-2.5 py-1 text-[#0D4E86]"
                                                    >
                                                        <Tag size={13} />
                                                        {category}
                                                    </span>
                                                ))}
                                                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600">
                                                    <CalendarDays size={14} />
                                                    {item.published_at}
                                                </span>
                                            </div>

                                            <h3 className="mt-4 text-xl leading-snug font-bold text-slate-950">{item.title}</h3>
                                            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{getContentPreview(item.content)}</p>
                                        </div>

                                        {item.view_url ? (
                                            <a
                                                href={item.view_url}
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
                            ))}
                    </div>

                    {!isLoading && pagination.last_page > 1 && (
                        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
                            <p className="text-sm text-slate-500">
                                Page {pagination.current_page} of {pagination.last_page}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={isLoading || pagination.current_page <= 1}
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={isLoading || pagination.current_page >= pagination.last_page}
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0D4E86] px-4 text-sm font-semibold text-white transition hover:bg-[#0A3F6D] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </PublicFaceLayout>
    );
}
