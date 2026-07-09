export interface Source {
  page: number;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Source[];
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  docId: string;
  docName: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
