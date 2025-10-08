import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Verify Supabase connection with better error handling
export async function verifySupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('buildings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase query error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}