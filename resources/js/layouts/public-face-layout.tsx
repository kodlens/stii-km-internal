import { PropsWithChildren } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

export default function PublicFaceLayout( { children, title, wide = false } : PropsWithChildren<{ title: string; wide?: boolean }>) {
  const { post, processing } = useForm();

  const handleLogout = () => {
    if (processing) return;

    post(route('logout'));
  };


  return (
    <>
      <Head title={title} />

      <main className="min-h-screen bg-[#0D4E86] text-white">
        <section className="relative flex min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0D4E86_0%,#0B4273_52%,#07325A_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[100px] border-b border-white/10 bg-white/5 backdrop-blur-sm" />
          {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(125,211,252,0.18),transparent_32%)]" /> */}
          {/* <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:72px_72px]" /> */}

          <div className={`relative z-10 mx-auto flex w-full ${wide ? 'max-w-[1600px]' : 'max-w-7xl'} flex-col px-5 py-6 sm:px-8 lg:px-10`}>
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

            {children}

            <ChatWidget />

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
