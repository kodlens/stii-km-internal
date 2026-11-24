import { FileText, ExternalLink } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

type Props = {
  message: ChatMessage;
};

// Formats basic markdown elements (bold, bullets, paragraphs, headers)
function renderFormattedContent(text: string) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((paragraph, pIdx) => {
    const trimmed = paragraph.trim();

    if (trimmed === '---' || trimmed === '***') {
      return <hr key={pIdx} className="my-2 border-slate-200" />;
    }

    if (trimmed.startsWith('### ')) {
      const heading = trimmed.replace(/^###\s+/, '');
      return (
        <h4
          key={pIdx}
          className="my-1.5 font-medium text-slate-800 text-xs"
          dangerouslySetInnerHTML={{ __html: formatInline(heading) }}
        />
      );
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const heading = trimmed.replace(/^#+\s+/, '');
      return (
        <h3
          key={pIdx}
          className="my-2 font-medium text-slate-800 text-sm"
          dangerouslySetInnerHTML={{ __html: formatInline(heading) }}
        />
      );
    }

    const lines = paragraph.split('\n');

    // Check if paragraph is a bullet list
    const isBulletList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '));

    if (isBulletList) {
      return (
        <ul key={pIdx} className="my-1.5 list-disc space-y-1 pl-4 text-slate-700 font-normal">
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
        className="my-1.5 leading-relaxed text-slate-700 font-normal first:mt-0 last:mb-0"
        dangerouslySetInnerHTML={{ __html: formatInline(paragraph) }}
      />
    );
  });
}

function formatInline(text: string): string {
  // Strip bold markers so result is plain and not excessively bold
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '$1');
  // Strip italic markers as well to keep clean plain result
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1');
  // Line breaks inside paragraph
  formatted = formatted.replace(/\n/g, '<br />');

  return formatted;
}

export default function ChatMessageItem({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-[#0D4E86] px-4 py-2.5 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-white">{message.content}</p>
          <span className="mt-1 block text-right text-[10px] text-sky-200/80">{message.timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[92%] rounded-2xl rounded-tl-none border border-slate-200/70 bg-white p-3.5 text-sm text-slate-800 shadow-sm">
        <div className="text-slate-700 font-normal text-[13px] leading-relaxed">{renderFormattedContent(message.content)}</div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Sources from Knowledge Base:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {message.sources.map((source) => (
                <a
                  key={source.material_id}
                  href={source.view_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-[#0D4E86] transition hover:border-[#0D4E86] hover:bg-[#0D4E86] hover:text-white"
                  title={`Open ${source.title}`}
                >
                  <FileText size={12} className="shrink-0 text-slate-400 group-hover:text-white" />
                  <span className="max-w-[200px] truncate">{source.title}</span>
                  <ExternalLink size={10} className="shrink-0 opacity-60 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        )}

        <span className="mt-2 block text-[10px] text-slate-400">{message.timestamp}</span>
      </div>
    </div>
  );
}
