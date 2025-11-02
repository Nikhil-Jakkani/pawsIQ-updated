import { EventEmitter } from 'node:events';

export type ConversationPayload = {
  conversation_id: number;
  participants?: Array<{
    participant_id?: number;
    role?: string | null;
    user_id?: string | number | null;
    provider_id?: string | number | null;
    admin_id?: string | number | null;
  }>;
  [key: string]: any;
};

export type MessagePayload = {
  conversationId: number;
  message: any;
  conversation?: ConversationPayload | null;
};

export type TypingPayload = {
  conversationId: number;
  actor: {
    role: 'user' | 'provider' | 'admin';
    id: string;
  };
  typing: boolean;
};

class ChatEventEmitter extends EventEmitter {}

export const chatEvents = new ChatEventEmitter();
chatEvents.setMaxListeners(100);
