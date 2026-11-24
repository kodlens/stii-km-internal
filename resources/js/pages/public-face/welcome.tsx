import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, ShieldCheck, Sparkles } from 'lucide-react';
import PublicFaceLayout from '@/layouts/public-face-layout';

export default function Welcome() {

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);


  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSearching) return;

    router.visit('/result', {
      data: { search: query },
      preserveState: true,
      preserveScroll: true,
      onStart: () => setIsSearching(true),
      onFinish: () => setIsSearching(false),
    });
  };

  return (
      <PublicFaceLayout title="Knowledge Management Internal">

      <div className="flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100 shadow-sm backdrop-blur">
            <Sparkles size={14} />
            DOST-STII KNOWLEDGE HUB
          </div>

          <h1 className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Find trusted knowledge faster.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-sky-100/90 sm:text-lg">
            Search publications, references, procedures, and shared resources from one secure knowledge hub.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl shadow-slate-950/25 backdrop-blur sm:flex-row"
          >
            <label htmlFor="knowledge-search" className="sr-only">
              Search knowledge base
            </label>
            <div className="flex min-h-14 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 focus-within:border-[#0D4E86] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0D4E86]/15">
              <Search className="shrink-0 text-slate-400" size={22} />
              <input
                id="knowledge-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search keywords, categories, or materials..."
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#0D4E86] px-7 text-base font-semibold text-white shadow-lg shadow-[#0D4E86]/20 transition hover:bg-[#0A3F6D] focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#0D4E86]"
            >
              <Search size={18} className={isSearching ? 'animate-pulse' : ''} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {[
              'Published materials',
              'Internal references',
              'Verified resources',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-sky-50 shadow-sm backdrop-blur"
              >
                <ShieldCheck size={16} className="text-sky-200" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

    </PublicFaceLayout>
  );
}
