import { ChatSource } from '@/types/chat';

type StreamChatOptions = {
  message: string;
  history: Array<{ role: string; content: string }>;
  onSources?: (sources: ChatSource[]) => void;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (errorMessage: string) => void;
  signal?: AbortSignal;
};

export async function streamChat({
  message,
  history,
  onSources,
  onToken,
  onDone,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  const csrfToken =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

  try {
    const response = await fetch('/rag-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        message,
        history,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errorText = 'Unable to connect to AI assistant.';
      try {
        const errorJson = await response.json();
        errorText = errorJson.message || errorText;
      } catch {
        // use default
      }
      onError(errorText);
      return;
    }

    if (!response.body) {
      onError('ReadableStream is not supported by this browser.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      // Keep the last partial line in buffer
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          // Empty line indicates event boundary in SSE
          currentEvent = 'message';
          continue;
        }

        if (line.startsWith('event:')) {
          currentEvent = line.replace(/^event:\s*/, '').trim();
          continue;
        }

        if (line.startsWith('data:')) {
          const dataStr = line.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(dataStr);

            if (currentEvent === 'sources') {
              if (parsed.sources && Array.isArray(parsed.sources) && onSources) {
                onSources(parsed.sources);
              }
            } else if (currentEvent === 'token') {
              if (typeof parsed.token === 'string') {
                onToken(parsed.token);
              }
            } else if (currentEvent === 'done') {
              onDone();
              return;
            } else if (currentEvent === 'error') {
              onError(parsed.message || 'Error occurred while generating response.');
              return;
            }
          } catch {
            // Raw text fallback if data is not JSON
            if (currentEvent === 'token') {
              onToken(dataStr);
            }
          }
        }
      }
    }

    onDone();
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const msg =
      err instanceof Error
        ? err.message
        : 'Failed to connect to the AI assistant service. Please try again.';
    onError(msg);
  }
}
