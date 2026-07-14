const fs = require('fs');
let sb = fs.readFileSync('src/lib/supabase.ts', 'utf8');

sb = `import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = !rawUrl.startsWith('http');
const supabaseUrl = isPlaceholder ? 'https://placeholder.supabase.co' : rawUrl;
const supabaseAnonKey = rawKey || 'placeholder-key';

const customFetch = async (url, options) => {
  if (isPlaceholder) {
    console.warn('Supabase URL not configured. Returning empty mock response.');
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return fetch(url, options);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  }
});
`;

fs.writeFileSync('src/lib/supabase.ts', sb);
