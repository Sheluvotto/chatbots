export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelName?: string; // Optional model name for multi-model responses
  attachments?: Attachment[]; // Optional attachments
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  content?: string; // For text-based files
  url?: string; // For files stored as URLs
  size?: number; // File size in bytes
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  multiModelMode: boolean; // Flag to indicate if multi-model mode is active
  consensusMode: boolean; // Flag to indicate if consensus mode is active
  attachments: Attachment[]; // Current attachments for the message being composed
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

export interface ModelResponse {
  modelId: string;
  modelName: string;
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}