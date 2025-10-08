export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type AudenMessage = Message;

export interface AudenResponse {
  choices: Array<{
    message: {
      content: string;
    }
  }>;
}