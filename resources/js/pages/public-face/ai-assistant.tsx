import { FormEvent, KeyboardEvent, ChangeEvent, useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Bot,
  Send,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  FileText,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

import PublicFaceLayout from '@/layouts/public-face-layout';
import { ChatMessage, ChatSource, ChatApiResponse } from '@/types/chat';

type PageProps = {
  initialQuery?: string;
};

const SUGGESTIONS = [
  'What are the uniform guidelines here in STII?',
  'What is the prescribed attire for Mondays and Fridays?',
  'What are the requirements for leave application?',
  'Where can I find the standard operating procedures?',
];

function renderFormattedContent(text: string) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((paragraph, pIdx) => {
    const trimmed = paragraph.trim();

    if (trimmed === '---' || trimmed === '***') {
      return <hr key={pIdx} className="my-3 border-slate-200" />;
    }

    if (trimmed.startsWith('### ')) {
      const heading = trimmed.replace(/^###\s+/, '');
      return (
        <h4
          key={pIdx}
          className="my-2.5 font-bold text-slate-900 text-sm"
          dangerouslySetInnerHTML={{ __html: formatInline(heading) }}
        />
      );
    }

    if (trimmed.startsWith('## ')) {
      const heading = trimmed.replace(/^##\s+/, '');
      return (
        <h3
          key={pIdx}
          className="my-3 font-bold text-slate-900 text-base"
          dangerouslySetInnerHTML={{ __html: formatInline(heading) }}
        />
      );
    }

    const lines = paragraph.split('\n');
    const isBulletList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '));

    if (isBulletList) {
      return (
        <ul key={pIdx} className="my-2 list-disc space-y-1.5 pl-5 text-slate-900">
          {lines.map((line, lIdx) => {
            const cleanLine = line.trim().replace(/^[-*]\s+/, '');
            return (
              <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(cleanLine) }} />
            );
          })}
        </ul>
      );
    }

    return (
      <p
        key={pIdx}
        className="my-2 leading-relaxed text-slate-900 first:mt-0 last:mb-0"
        dangerouslySetInnerHTML={{ __html: formatInline(paragraph) }}
      />
    );
  });
}

function formatInline(text: string): string {
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/\n/g, '<br />');

  return formatted;
}

export default function AiAssistant({ initialQuery = '' }: PageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<ChatSource[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialTriggeredRef = useRef(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);
    setErrorMessage(null);

    const historyPayload = nextMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await axios.post<ChatApiResponse>('/rag-chat', {
        message: text,
        history: historyPayload,
      });

      if (response.data?.success && response.data?.reply) {
        const sources = response.data.sources ?? [];
        const assistantMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: response.data.reply,
          sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setActiveSources(sources);
      } else {
        setErrorMessage(response.data?.message || 'Unable to retrieve answer from AI service.');
      }
    } catch (err: unknown) {
      let msg = 'Failed to connect to the AI assistant service. Please try again.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // If page was loaded with an initial question (?q=...), trigger it automatically
  useEffect(() => {
    if (initialQuery.trim() && !initialTriggeredRef.current) {
      initialTriggeredRef.current = true;
      sendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    sendMessage(trimmed);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([]);
    setActiveSources([]);
    setErrorMessage(null);
  };

  return (
    <PublicFaceLayout title="STII-Agent Knowledge Assistant">
      <div className="flex flex-1 flex-col py-6 mt-5">

        {/* Top Header Card */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0D4E86] shadow-lg shadow-slate-950/15">
              <Bot size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">STII-Agent</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/30 bg-sky-400/20 px-2.5 py-0.5 text-xs font-semibold text-sky-100">
                  <ShieldCheck size={12} className="text-emerald-300" />
                  STII Verified Knowledge
                </span>
              </div>
              <p className="mt-0.5 text-xs text-sky-100/80 sm:text-sm">
                Official AI Assistant grounded directly in indexed DOST-STII internal repository documents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleReset}
              disabled={messages.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white hover:text-[#0D4E86] focus:ring-4 focus:ring-white/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={14} />
              New Chat
            </button>
          </div>
        </section>

        {/* Workspace: Chat Center + Sources Sidebar */}
        <div className="mt-5 flex min-h-[640px] flex-1 flex-col gap-5 lg:flex-row">
          {/* Center Column: Conversation Thread */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-2xl shadow-slate-950/20">
            {/* Thread Container */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {messages.length === 0 && (
                <div className="mx-auto my-auto flex max-w-lg flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0D4E86]/10 text-[#0D4E86]">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-slate-900">How can STII-Agent help you today?</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                    Ask questions about dress codes, leave filings, procurement, travel policies, and standard procedures.
                  </p>

                  <div className="mt-6 flex w-full flex-col gap-2.5 text-left">
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Suggested Questions
                    </p>
                    {SUGGESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(item)}
                        className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700 transition hover:border-[#0D4E86]/50 hover:bg-[#0D4E86]/5 hover:text-[#0D4E86]"
                      >
                        <span>{item}</span>
                        <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0D4E86]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <article
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-5 py-3.5 shadow-sm sm:max-w-[80%] ${
                        isUser
                          ? 'rounded-tr-none bg-[#0D4E86] text-white'
                          : 'rounded-tl-none border border-slate-200/80 bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 border-b pb-2 text-[11px] opacity-75">
                        <span className="font-bold">
                          {isUser ? 'You' : 'STII-Agent'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 hover:text-[#0D4E86]"
                              title="Copy answer"
                            >
                              {copiedId === msg.id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-sm leading-relaxed">
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          renderFormattedContent(msg.content)
                        )}
                      </div>

                      {/* Inline Source tags for mobile or quick review */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/70 pt-2.5">
                          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Sources:
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {msg.sources.map((s) => (
                              <a
                                key={s.material_id}
                                href={s.view_url ?? '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-[#0D4E86] transition hover:bg-[#0D4E86] hover:text-white"
                              >
                                <FileText size={11} />
                                <span className="max-w-[220px] truncate">{s.title}</span>
                                <ExternalLink size={10} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-xs text-slate-600 shadow-sm max-w-md">
                  <LoaderCircle size={18} className="animate-spin text-[#0D4E86]" />
                  <div>
                    <p className="font-semibold text-slate-800">Searching STII repository & synthesizing response...</p>
                    <p className="text-[11px] text-slate-400">Grounding response in official knowledge base</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <p className="font-bold">Error Processing Request</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Input Form */}
            <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex items-end gap-2.5 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-[#0D4E86] focus-within:ring-4 focus-within:ring-[#0D4E86]/15">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask STII-Agent a question about policies, procedures, guidelines..."
                  rows={1}
                  disabled={isLoading}
                  className="max-h-[140px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D4E86] text-white shadow-md shadow-[#0D4E86]/20 transition hover:bg-[#0A3F6D] focus:ring-4 focus:ring-sky-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send query"
                >
                  {isLoading ? (
                    <LoaderCircle size={18} className="animate-spin text-white" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-slate-400">
                <p>Press Enter to send, Shift + Enter for newline</p>
                <p className="hidden sm:inline">Responses are grounded in published STII materials</p>
              </div>
            </form>
          </div>

          {/* Right Panel: Referenced Documents */}
          <aside className="w-full shrink-0 lg:w-96">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 text-slate-900 shadow-2xl shadow-slate-950/15">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D4E86]/10 text-[#0D4E86]">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Referenced Documents</h2>
                    <p className="text-[11px] text-slate-500">Grounded evidence for the current response</p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {activeSources.length}
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                {activeSources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <HelpCircle size={32} className="text-slate-300" />
                    <p className="mt-3 text-xs font-semibold text-slate-600">No document citations yet</p>
                    <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-slate-400">
                      When STII-Agent answers your question, the matching repository documents will appear here with direct view links.
                    </p>
                  </div>
                ) : (
                  activeSources.map((source, sIdx) => (
                    <div
                      key={source.material_id || sIdx}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-[#0D4E86]/40 hover:bg-[#0D4E86]/5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D4E86]">
                          <FileText size={14} className="shrink-0" />
                          <span>Source #{sIdx + 1}</span>
                        </div>

                        {source.publish_date && (
                          <span className="text-[10px] text-slate-400">{source.publish_date}</span>
                        )}
                      </div>

                      <h3 className="mt-2 text-xs font-bold leading-snug text-slate-900">
                        {source.title}
                      </h3>

                      {source.view_url ? (
                        <a
                          href={source.view_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:bg-[#0D4E86] hover:text-white"
                        >
                          <ExternalLink size={12} />
                          View Document
                        </a>
                      ) : (
                        <span className="mt-3 inline-block text-[11px] text-slate-400">
                          Document text indexed
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500">
                <p className="font-semibold text-slate-700">Strict Knowledge Grounding</p>
                <p className="mt-0.5">
                  STII-Agent synthesizes answers only from published repository files to maintain truthfulness and prevent hallucinations.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicFaceLayout>
  );
}
