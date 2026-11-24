export interface ChatSource {
  material_id: number;
  title: string;
  publish_date?: string | null;
  view_url: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

export interface ChatApiResponse {
  success: boolean;
  reply?: string;
  sources?: ChatSource[];
  message?: string;
  error?: string | null;
}
