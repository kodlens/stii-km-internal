import { FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { LogOut, Search, ShieldCheck, Sparkles } from 'lucide-react';

export default function Welcome() {
  const { post, processing } = useForm();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleLogout = () => {
    if (processing) return;

    post(route('logout'));
  };

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
    <>
      <Head title="Knowledge Management Internal" />

      <main className="min-h-screen bg-[#0D4E86] text-white">
        <section className="relative flex min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0D4E86_0%,#0B4273_52%,#07325A_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[100px] border-b border-white/10 bg-white/5 backdrop-blur-sm" />
          {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(125,211,252,0.18),transparent_32%)]" /> */}
          {/* <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:72px_72px]" /> */}

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#0D4E86] shadow-lg shadow-slate-950/15">
                  <BookOpen size={22} />
                </div> */}
                <div>
                  <img src='/img/app-logo-black-update.png' width={250} alt="dost-stii logo" />
                  {/* <p className="text-sm font-semibold text-white">Knowledge Management</p>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-100/80">Internal Portal</p> */}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={processing}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-white hover:text-[#0D4E86] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/10 disabled:hover:text-white"
              >
                <LogOut size={16} className={processing ? 'animate-pulse' : ''} />
                {processing ? 'Logging out...' : 'Logout'}
              </button>
            </header>

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
                      placeholder="Search keywords, topics, or materials..."
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

            <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-sky-100/75 sm:flex-row">
              <p>Internal use only. Access and content are managed by authorized personnel.</p>
              <p>Knowledge Management Internal</p>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
