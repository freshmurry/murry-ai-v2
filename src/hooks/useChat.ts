import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Message, ChatResponse } from '../types/chat';

export function useChat(
  conversationId?: string,
  projectId?: string
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(content: string) {
    try {
      setLoading(true);
      setError(null);

      const optimistic: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
      };

      setMessages(prev => [...prev, optimistic]);

      const res = await api<ChatResponse>(
        'POST',
        '/api/chat',
        {
          conversation_id: conversationId,
          project_id: projectId,
          content,
        }
      );

      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}