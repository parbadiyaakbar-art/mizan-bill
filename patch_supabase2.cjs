const fs = require('fs');
let sb = fs.readFileSync('src/lib/supabase.ts', 'utf8');

sb = `import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = !rawUrl.startsWith('http');
const supabaseUrl = isPlaceholder ? 'https://placeholder.supabase.co' : rawUrl;
const supabaseAnonKey = rawKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;

fs.writeFileSync('src/lib/supabase.ts', sb);
