import type { Message } from '../types/chat';

interface Props {
  message: Message;
}

export default function MessageBubble({
  message,
}: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${
        isUser
          ? 'justify-end'
          : 'justify-start'
      }`}
    >
      <div
        className={`
          max-w-[80%]
          rounded-xl
          px-4
          py-2
          text-sm
          ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-800 text-zinc-100'
          }
        `}
      >
        {message.content}
      </div>
    </div>
  );
}