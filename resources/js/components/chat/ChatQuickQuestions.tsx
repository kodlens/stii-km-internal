import { Sparkles } from 'lucide-react';

type Props = {
  onSelect: (question: string) => void;
};

const SUGGESTIONS = [
  'What are the uniform guidelines here in STII?',
  'What are the prescribed attire for Mondays and Fridays?',
  'Where can I find the standard operating procedures?',
  'What documents are required for attendance tracking?',
];

export default function ChatQuickQuestions({ onSelect }: Props) {
  return (
    <div className="my-auto flex flex-col items-center px-4 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D4E86]/10 text-[#0D4E86]">
        <Sparkles size={24} />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-800">STII Knowledge Assistant</h3>
      <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-slate-500">
        Ask anything about DOST-STII internal policies, guidelines, and manuals.
      </p>

      <div className="mt-4 flex w-full flex-col gap-2">
        <p className="text-left text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Suggested Questions:
        </p>
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs text-slate-700 transition hover:border-[#0D4E86]/50 hover:bg-[#0D4E86]/5 hover:text-[#0D4E86] active:scale-[0.99]"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
