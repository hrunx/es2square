import type { Message } from '../types/auden';

export async function talkToAuden(messages: Message[]): Promise<string> {
  try {
    const url = `${import.meta.env.VITE_AUDEN_PROXY}`;
    if (!url) {
      throw new Error('Auden proxy URL is not configured');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ 
        messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
        api_key: import.meta.env.VITE_DEEPSEEK_API_KEY
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with AI assistant');
  }
}