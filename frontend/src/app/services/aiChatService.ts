import { ChatMessage } from '../types/aiType';
import { AIChatPayload, AIChatResponse } from '../dto/AIChatDTO';

export async function sendAIChatMessage(
  payload: AIChatPayload
): Promise<ChatMessage> {
  const response = await fetch('http://localhost:3001/ai/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to communicate with AI Service');
  }

  const data: AIChatResponse = await response.json();

  if (!data.success || !data.message) {
    throw new Error(data.error || 'Invalid response format from AI Server');
  }

  return data.message;
}