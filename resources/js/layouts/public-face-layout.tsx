import { PropsWithChildren } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LogOut, Search, Sparkles } from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

export default function PublicFaceLayout( { children, title, wide = false } : PropsWithChildren<{ title: string; wide?: boolean }>) {
  const { post, processing } = useForm();
  const { url } = usePage();
  const pathname = url.split('?')[0];

  const isAiPage = pathname.startsWith('/ai-assistant');
  const isSearchPage = pathname === '/' || pathname.startsWith('/result') || pathname.startsWith('/view-material');

  const handleLogout = () => {
    if (processing) return;

    post(route('logout'));
  };


  return (
    <>
      <Head title={title} />

      <main className="min-h-screen bg-[#0D4E86] text-white">
        <section className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0D4E86_0%,#0B4273_52%,#07325A_100%)]" />

          {/* Persistent, Stable Top Header Bar */}
          <header className="relative z-20 w-full border-b border-white/10 bg-white/5 backdrop-blur-md">
            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
              <div className="flex items-center gap-4 sm:gap-8">
                <Link href="/" className="shrink-0 transition hover:opacity-95">
                  <img src="/img/app-logo-black-update.png" width={220} alt="dost-stii logo" />
                </Link>

                {/* Primary Navigation Pills */}
                <nav className="flex items-center gap-2">
                  <Link
                    href="/"
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition sm:text-sm ${
                      isSearchPage && !isAiPage
                        ? 'bg-white/25 shadow-sm ring-2 ring-white/60 border border-white/40'
                        : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <Search size={16} className="text-white" />
                    <span className="text-white">Search Materials</span>
                  </Link>

                  <Link
                    href="/ai-assistant"
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition sm:text-sm ${
                      isAiPage
                        ? 'bg-white/25 shadow-sm ring-2 ring-white/60 border border-white/40'
                        : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <Sparkles size={16} className="text-amber-300" />
                    <span className="text-white">STII-Agent</span>
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950">
                      AI
                    </span>
                  </Link>
                </nav>
              </div>

              {/* Logout */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={processing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-white hover:text-[#0D4E86] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                >
                  <LogOut size={16} className={processing ? 'animate-pulse' : ''} />
                  <span>{processing ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Page Content */}
          <div className={`relative z-10 mx-auto flex w-full flex-1 ${wide ? 'max-w-[1600px]' : 'max-w-7xl'} flex-col px-5 py-6 sm:px-8 lg:px-10`}>
            {children}

            <ChatWidget />

            <footer className="mt-auto flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-sky-100/75 sm:flex-row">
              <p>Internal use only. Access and content are managed by authorized personnel.</p>
              <p>Knowledge Management Internal</p>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
