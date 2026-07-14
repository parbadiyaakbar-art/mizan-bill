const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /supabase\.auth\.getSession\(\)\.then\(\(\{ data: \{ session \} \} \) => \{[\s\S]*?setLoading\(false\);\n    \}\);/,
  `supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Supabase connection error:", err);
      setLoading(false); // Stop loading even if there's a network error
    });`
);

fs.writeFileSync('src/App.tsx', app);
