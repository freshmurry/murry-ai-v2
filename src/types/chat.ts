export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
  }
  
  export interface ChatResponse {
    success: boolean;
    data: {
      conversation_id: string;
      response: string;
      messages: Message[];
    };
  }