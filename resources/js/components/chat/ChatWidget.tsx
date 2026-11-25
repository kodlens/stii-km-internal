import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  RotateCcw,
  Bot,
  Sparkles,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { streamChat } from '@/utils/streamChat';
import ChatMessageItem from './ChatMessageItem';
import ChatQuickQuestions from './ChatQuickQuestions';
import ChatInput from './ChatInput';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide the floating widget if user is currently on the dedicated full-page AI assistant
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/ai-assistant')) {
    return null;
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const botMsgId = `bot-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, assistantMsg]);
    setIsLoading(true);
    setErrorMessage(null);

    // Format conversational history for context
    const historyPayload = nextMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await streamChat({
      message: text,
      history: historyPayload,
      onSources: (sources) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, sources } : m))
        );
      },
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, content: m.content + token } : m))
        );
      },
      onDone: () => {
        setIsLoading(false);
      },
      onError: (errMsg) => {
        setErrorMessage(errMsg);
        setIsLoading(false);
        setMessages((prev) =>
          prev.filter((m) => !(m.id === botMsgId && m.content === ''))
        );
      },
    });
  };

  const handleResetChat = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Popover Window */}
      {isOpen && (
        <div className="mb-3 flex h-[580px] max-h-[82vh] w-[92vw] max-w-[410px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-2xl shadow-slate-950/25 transition-all">
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-white/15 bg-[#0D4E86] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Bot size={18} className="text-white" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0D4E86] bg-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-white">STII-Agent</h2>
                  <span className="rounded bg-sky-200/20 px-1.5 py-0.5 text-[9px] font-semibold text-sky-100">
                    STII Verified
                  </span>
                </div>
                <p className="text-[10px] text-sky-200">Official Knowledge Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                disabled={messages.length === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-30"
                title="Clear conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Message Thread Area */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <ChatQuickQuestions onSelect={handleSendMessage} />
            )}

            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3.5 py-2.5 text-xs text-slate-600 shadow-sm max-w-[80%]">
                <LoaderCircle size={15} className="animate-spin text-[#0D4E86]" />
                <span className="font-medium">Searching knowledge base & thinking...</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative flex items-center gap-2 rounded-full p-3.5 shadow-2xl shadow-[#0D4E86]/30 transition-all duration-200 active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-white hover:bg-slate-900'
            : 'bg-[#0D4E86] text-white hover:bg-[#0A3F6D] hover:shadow-sky-900/40'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open STII Knowledge Assistant'}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <div className="relative">
              <MessageSquare size={24} />
              <Sparkles size={11} className="absolute -top-1 -right-1.5 text-amber-300" />
            </div>
            <span className="hidden font-semibold text-xs tracking-wide sm:inline pr-1">
              Ask STII-Agent
            </span>
          </>
        )}
      </button>
    </div>
  );
}
