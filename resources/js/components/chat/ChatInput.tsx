import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { Send, LoaderCircle } from 'lucide-react';

type Props = {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
};

export default function ChatInput({ onSendMessage, isLoading }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setText('');

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
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200/80 bg-white p-2.5">
      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-[#0D4E86] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0D4E86]/15">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about STII guidelines..."
          rows={1}
          disabled={isLoading}
          className="max-h-[120px] min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0D4E86] text-white shadow-sm transition hover:bg-[#0A3F6D] focus:ring-2 focus:ring-[#0D4E86]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          {isLoading ? (
            <LoaderCircle size={16} className="animate-spin text-white" />
          ) : (
            <Send size={15} className="translate-x-[-1px] translate-y-[-0.5px]" />
          )}
        </button>
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-400">
        AI responses are grounded in indexed STII documents. Always verify critical decisions.
      </p>
    </form>
  );
}
