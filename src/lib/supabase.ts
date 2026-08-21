import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve environment variables from Vite, Next, or Node environments
const resolveEnv = (keys: string[]): string => {
  for (const key of keys) {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      const val = String((import.meta as any).env[key]).trim();
      if (val) return val;
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      const val = String(process.env[key]).trim();
      if (val) return val;
    }
  }
  return '';
};

export const getSupabaseUrl = (): string => {
  return resolveEnv(['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'REACT_APP_SUPABASE_URL']);
};

export const getSupabaseAnonKey = (): string => {
  return resolveEnv(['VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY']);
};

// Check if credentials are valid and not placeholders
export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return Boolean(
    url && 
    anonKey && 
    !url.includes('placeholder') &&
    !url.includes('seu-projeto') && 
    !anonKey.includes('placeholder') &&
    !anonKey.includes('seu-anon-key')
  );
};

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    if (!isSupabaseConfigured()) {
      console.error(
        '[Supabase Config Alert] As variáveis de ambiente do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram detectadas no ambiente. Todas as operações remotas exigem estas chaves para persistência no banco de dados.'
      );
    } else {
      console.info(`[Supabase] Conectado ao endpoint remoto: ${url}`);
    }

    supabaseInstance = createClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

