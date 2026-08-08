import {ChatMessage} from '../types/aiType';

export interface AIChatPayload {
  document: Record<string, any>;
  messages: Array<ChatMessage>;
}

export interface AIChatResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}