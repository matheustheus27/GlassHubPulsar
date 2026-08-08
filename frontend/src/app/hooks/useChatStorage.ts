import { useState, useEffect } from 'react';
import { ChatMessage } from '../types/aiType';

export function useChatStorage() {
  // Lazy initialization of states directly from localStorage to avoid unnecessary re-renders
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('glass_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState<string>(() => {
    return localStorage.getItem('glass_input') || '';
  });

  const [loading, setLoading] = useState<'Y' | 'N'>(() => {
    return (localStorage.getItem('glass_loading') as 'Y' | 'N') || 'N';
  });

  // Persistence effects with proper serialization
  useEffect(() => {
    localStorage.setItem('glass_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('glass_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('glass_loading', loading);
  }, [loading]);

  // Utility function to clear the chat whenever the user wants
  const clearChat = () => {
    setMessages([]);
    setInput('');
    setLoading('N');
    localStorage.removeItem('glass_messages');
    localStorage.removeItem('glass_input');
    localStorage.removeItem('glass_loading');
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    clearChat
  };
}