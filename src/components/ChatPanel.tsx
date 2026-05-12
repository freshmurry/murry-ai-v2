import {
    useEffect,
    useRef,
    useState,
  } from 'react';
  
  import MessageBubble from './MessageBubble';
  import { useChat } from '../hooks/useChat';
  import { api } from '../api/client';
  
  interface Props {
    conversationId?: string;
    projectId?: string;
  }
  
  export default function ChatPanel({
    conversationId,
    projectId,
  }: Props) {
    const {
      messages,
      loading,
      error,
      sendMessage,
    } = useChat(
      conversationId,
      projectId
    );
  
    const [input, setInput] = useState('');
    const [uploading, setUploading] =
      useState(false);
  
    const bottomRef =
      useRef<HTMLDivElement>(null);
  
    const fileInputRef =
      useRef<HTMLInputElement>(null);
  
    useEffect(() => {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, [messages]);
  
    async function send() {
      if (!input.trim()) return;
  
      await sendMessage(input.trim());
  
      setInput('');
    }
  
    async function uploadFromChat(
      file: File
    ) {
      if (!projectId) return;
  
      try {
        setUploading(true);
  
        const form = new FormData();
  
        form.append('file', file);
        form.append('project_id', projectId);
  
        await api(
          'POST',
          '/api/upload',
          form
        );
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
  
    return (
      <div className="flex flex-col h-full">
        {/* Messages */}
  
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}
  
          {loading && (
            <div className="text-sm text-zinc-500">
              Loading...
            </div>
          )}
  
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
  
          <div ref={bottomRef} />
        </div>
  
        {/* Input */}
  
        <div className="border-t p-3">
          <div className="flex gap-2">
            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              Upload
            </button>
  
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={e => {
                const file =
                  e.target.files?.[0];
  
                if (file) {
                  uploadFromChat(file);
                }
              }}
            />
  
            <textarea
              value={input}
              onChange={e =>
                setInput(e.target.value)
              }
              onKeyDown={e => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  send();
                }
              }}
              className="flex-1 border rounded-lg p-2"
            />
  
            <button
              onClick={send}
              disabled={
                loading ||
                uploading ||
                !input.trim()
              }
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }