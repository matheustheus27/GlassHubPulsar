import { ChatMessage } from '../types/aiType';
import { AIChatPayload, AIChatResponse } from '../dto/AIChatDTO';

export async function sendAIChatMessage(
  payload: AIChatPayload
): Promise<ChatMessage> {
  const token = localStorage.getItem('glasshub_token');

  const response = await fetch('/api/ai/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to communicate with AI Service');
  }

  const data = await response.json();

  if (!data.success || !data.messages) {
    throw new Error(data.error || 'Invalid response format from AI Server');
  }

  return data.messages;
}