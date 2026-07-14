const fs = require('fs');
let login = fs.readFileSync('src/views/Login.tsx', 'utf8');

login = login.replace(
  /const isSupabaseConfigured = import\.meta\.env\.VITE_SUPABASE_URL && import\.meta\.env\.VITE_SUPABASE_ANON_KEY;/,
  "const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL?.startsWith('http') && import.meta.env.VITE_SUPABASE_ANON_KEY;"
);

fs.writeFileSync('src/views/Login.tsx', login);
